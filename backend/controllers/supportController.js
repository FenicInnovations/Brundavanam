const crypto = require("crypto");
const SupportTicket = require("../models/SupportTicket");
const SupportMessage = require("../models/SupportMessage");
const User = require("../models/User");
const emailService = require("../services/emailService");
const { isValidIndianMobile, normalizePhone } = require("../utils/phone");

/**
 * Generate formatted ticket number like SUP-2026-000123
 */
function generateTicketNumber() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `SUP-${year}-${randomSuffix}`;
}

// ==========================================
// CUSTOMER & PUBLIC ENDPOINTS
// ==========================================

/**
 * POST /api/support/tickets
 * Public/Customer: Submit new contact request/support ticket
 */
async function createTicket(req, res, next) {
  try {
    const { name, email, phone, subject, category, message, attachments = [] } = req.body;

    if (!name || !name.trim()) {
      const err = new Error("Name is required");
      err.statusCode = 400;
      throw err;
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      const err = new Error("A valid email address is required");
      err.statusCode = 400;
      throw err;
    }
    if (!phone || !phone.trim()) {
      const err = new Error("Phone number is required");
      err.statusCode = 400;
      throw err;
    }
    if (!subject || !subject.trim()) {
      const err = new Error("Subject is required");
      err.statusCode = 400;
      throw err;
    }
    if (!message || !message.trim()) {
      const err = new Error("Message content cannot be empty");
      err.statusCode = 400;
      throw err;
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : phone.trim();

    // Check if user is authenticated
    const customerId = req.user ? req.user._id : null;
    const guestAccessToken = crypto.randomBytes(24).toString("hex");
    const ticketNumber = generateTicketNumber();

    const ticket = await SupportTicket.create({
      ticketNumber,
      customer: customerId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: formattedPhone,
      subject: subject.trim(),
      category: category || "general",
      status: "new",
      priority: "medium",
      guestAccessToken,
      channel: "website",
      lastMessageAt: new Date(),
      lastCustomerMessageAt: new Date(),
    });

    // Create initial customer message in thread
    const initialMessage = await SupportMessage.create({
      ticket: ticket._id,
      sender: customerId,
      senderType: "customer",
      senderName: name.trim(),
      senderEmail: email.trim().toLowerCase(),
      message: message.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      channel: "website",
      isInternal: false,
      noteType: "message",
    });

    // Create system event: Ticket Created
    await SupportMessage.create({
      ticket: ticket._id,
      senderType: "system",
      senderName: "System",
      message: `Enquiry received via Website Contact Form. Ticket #${ticketNumber} created.`,
      isInternal: false,
      noteType: "system_event",
      systemEventDetails: {
        action: "ticket_created",
        newValue: "new",
      },
    });

    // Dispatch background email notifications (non-blocking)
    ticket.initialMessage = message.trim();
    emailService.sendTicketCreatedEmail({ ticket }).catch((e) => {
      console.error("[supportController] Email acknowledgment error:", e.message);
    });
    emailService.sendAdminNotificationEmail({ ticket, message: initialMessage, eventType: "new_ticket" }).catch((e) => {
      console.error("[supportController] Admin notification error:", e.message);
    });

    res.status(201).json({
      success: true,
      message: "Your enquiry has been received. Our team will get back to you shortly.",
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        status: ticket.status,
        guestAccessToken: ticket.guestAccessToken,
        createdAt: ticket.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/support/tickets/track
 * Guest/Public: Fetch ticket conversation via ticketNumber
 */
async function getGuestTicket(req, res, next) {
  try {
    const { ticketNumber } = req.query;

    if (!ticketNumber || !ticketNumber.trim()) {
      const err = new Error("Ticket reference number is required (e.g. SUP-2026-400904)");
      err.statusCode = 400;
      throw err;
    }

    const cleanInput = ticketNumber.trim().replace(/^#/, "");
    const query = {
      $or: [
        { ticketNumber: cleanInput.toUpperCase() },
        { ticketNumber: new RegExp(cleanInput, "i") },
      ],
    };

    const ticket = await SupportTicket.findOne(query).populate("assignedTo", "name");

    if (!ticket) {
      const err = new Error(`Ticket #${ticketNumber} could not be found. Please verify your reference number.`);
      err.statusCode = 404;
      throw err;
    }

    // Only fetch non-internal messages for customers/guests
    const messages = await SupportMessage.find({
      ticket: ticket._id,
      isInternal: false,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        name: ticket.name,
        email: ticket.email,
        phone: ticket.phone,
        subject: ticket.subject,
        category: ticket.category,
        categoryLabel: ticket.getCategoryLabel ? ticket.getCategoryLabel() : ticket.category,
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assignedTo?.name || "Support Team",
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
      messages,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/support/tickets/track/messages
 * Guest/Public: Reply to existing ticket thread via ticketNumber
 */
async function replyGuestTicket(req, res, next) {
  try {
    const { ticketNumber, message, attachments = [] } = req.body;

    if (!ticketNumber || !ticketNumber.trim() || !message || !message.trim()) {
      const err = new Error("Ticket reference number and message are required");
      err.statusCode = 400;
      throw err;
    }

    const cleanInput = ticketNumber.trim().replace(/^#/, "");
    const query = {
      $or: [
        { ticketNumber: cleanInput.toUpperCase() },
        { ticketNumber: new RegExp(cleanInput, "i") },
      ],
    };

    const ticket = await SupportTicket.findOne(query);

    if (!ticket) {
      const err = new Error(`Ticket #${ticketNumber} not found`);
      err.statusCode = 404;
      throw err;
    }

    // PART 15: If ticket was resolved or closed, automatically reopen it
    const wasResolvedOrClosed = ticket.status === "resolved" || ticket.status === "closed";
    if (wasResolvedOrClosed) {
      const prevStatus = ticket.status;
      ticket.status = "open";
      ticket.resolvedAt = null;
      ticket.closedAt = null;

      await SupportMessage.create({
        ticket: ticket._id,
        senderType: "system",
        senderName: "System",
        message: `Ticket automatically reopened from ${prevStatus} by customer reply.`,
        isInternal: false,
        noteType: "system_event",
        systemEventDetails: {
          action: "ticket_reopened",
          previousValue: prevStatus,
          newValue: "open",
        },
      });

      emailService.sendTicketReopenedEmail({ ticket }).catch((e) => console.error(e.message));
    } else if (ticket.status === "waiting_customer") {
      ticket.status = "in_progress";
    }

    ticket.lastMessageAt = new Date();
    ticket.lastCustomerMessageAt = new Date();
    await ticket.save();

    const newMessage = await SupportMessage.create({
      ticket: ticket._id,
      senderType: "customer",
      senderName: ticket.name,
      senderEmail: ticket.email,
      message: message.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      channel: "website",
      isInternal: false,
      noteType: "message",
    });

    // Notify admin team
    emailService.sendAdminNotificationEmail({
      ticket,
      message: newMessage,
      eventType: "customer_reply",
    }).catch((e) => console.error(e.message));

    res.status(201).json({
      success: true,
      message: newMessage,
      ticket: {
        id: ticket._id,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/customer/support/tickets
 * Authenticated Customer: List all their tickets
 */
async function getCustomerTickets(req, res, next) {
  try {
    const customerId = req.user._id;

    // Match either by customer ID or by user's email/phone if previously created as guest
    const userEmail = req.user.email ? req.user.email.toLowerCase() : null;
    const userPhone = req.user.phone ? normalizePhone(req.user.phone) : null;

    const query = {
      $or: [
        { customer: customerId },
        ...(userEmail ? [{ email: userEmail }] : []),
      ],
    };

    const tickets = await SupportTicket.find(query)
      .sort({ lastMessageAt: -1 })
      .lean();

    // Attach latest message snippet
    const ticketIds = tickets.map((t) => t._id);
    const latestMessages = await SupportMessage.aggregate([
      { $match: { ticket: { $in: ticketIds }, isInternal: false, noteType: "message" } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$ticket",
          latestMessage: { $first: "$message" },
          senderName: { $first: "$senderName" },
          createdAt: { $first: "$createdAt" },
        },
      },
    ]);

    const latestMap = {};
    latestMessages.forEach((m) => {
      latestMap[m._id.toString()] = m;
    });

    const enriched = tickets.map((t) => ({
      ...t,
      latestMessage: latestMap[t._id.toString()]?.latestMessage || t.subject,
      latestMessageAt: latestMap[t._id.toString()]?.createdAt || t.lastMessageAt,
    }));

    res.json({
      success: true,
      tickets: enriched,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/customer/support/tickets/:id
 * Authenticated Customer: Get specific ticket and conversation history
 */
async function getCustomerTicketById(req, res, next) {
  try {
    const { id } = req.params;
    const customerId = req.user._id;

    const ticket = await SupportTicket.findById(id).populate("assignedTo", "name");

    if (!ticket) {
      const err = new Error("Support ticket not found");
      err.statusCode = 404;
      throw err;
    }

    // PART 17: Security - Ensure customer can ONLY access their own ticket
    const isOwner =
      (ticket.customer && ticket.customer.toString() === customerId.toString()) ||
      (req.user.email && ticket.email.toLowerCase() === req.user.email.toLowerCase());

    if (!isOwner) {
      const err = new Error("Access forbidden. You do not have permission to view this ticket.");
      err.statusCode = 403;
      throw err;
    }

    // Link customer ID if not linked before
    if (!ticket.customer) {
      ticket.customer = customerId;
      await ticket.save();
    }

    // Customers never see internal notes (isInternal: false)
    const messages = await SupportMessage.find({
      ticket: ticket._id,
      isInternal: false,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        name: ticket.name,
        email: ticket.email,
        phone: ticket.phone,
        subject: ticket.subject,
        category: ticket.category,
        categoryLabel: ticket.getCategoryLabel ? ticket.getCategoryLabel() : ticket.category,
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assignedTo?.name || "Support Team",
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
      messages,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/customer/support/tickets/:id/messages
 * Authenticated Customer: Reply to existing ticket
 */
async function replyCustomerTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { message, attachments = [] } = req.body;
    const customerId = req.user._id;

    if (!message || !message.trim()) {
      const err = new Error("Message content cannot be empty");
      err.statusCode = 400;
      throw err;
    }

    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      const err = new Error("Ticket not found");
      err.statusCode = 404;
      throw err;
    }

    const isOwner =
      (ticket.customer && ticket.customer.toString() === customerId.toString()) ||
      (req.user.email && ticket.email.toLowerCase() === req.user.email.toLowerCase());

    if (!isOwner) {
      const err = new Error("Access forbidden. You do not own this ticket.");
      err.statusCode = 403;
      throw err;
    }

    // PART 15: If ticket is resolved or closed, automatically reopen it
    const wasResolvedOrClosed = ticket.status === "resolved" || ticket.status === "closed";
    if (wasResolvedOrClosed) {
      const prevStatus = ticket.status;
      ticket.status = "open";
      ticket.resolvedAt = null;
      ticket.closedAt = null;

      await SupportMessage.create({
        ticket: ticket._id,
        senderType: "system",
        senderName: "System",
        message: `Ticket automatically reopened from ${prevStatus} by customer message.`,
        isInternal: false,
        noteType: "system_event",
        systemEventDetails: {
          action: "ticket_reopened",
          previousValue: prevStatus,
          newValue: "open",
        },
      });

      emailService.sendTicketReopenedEmail({ ticket }).catch((e) => console.error(e.message));
    } else if (ticket.status === "waiting_customer") {
      ticket.status = "in_progress";
    }

    ticket.lastMessageAt = new Date();
    ticket.lastCustomerMessageAt = new Date();
    await ticket.save();

    const newMessage = await SupportMessage.create({
      ticket: ticket._id,
      sender: customerId,
      senderType: "customer",
      senderName: req.user.name || ticket.name,
      senderEmail: req.user.email || ticket.email,
      message: message.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      channel: "website",
      isInternal: false,
      noteType: "message",
    });

    emailService.sendAdminNotificationEmail({
      ticket,
      message: newMessage,
      eventType: "customer_reply",
    }).catch((e) => console.error(e.message));

    res.status(201).json({
      success: true,
      message: newMessage,
      ticket: {
        id: ticket._id,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// ADMIN DASHBOARD & WORKSPACE ENDPOINTS
// ==========================================

/**
 * GET /api/admin/support/stats
 * Admin: Get support dashboard statistics
 */
async function getAdminSupportStats(req, res, next) {
  try {
    const totalTickets = await SupportTicket.countDocuments();
    const newTickets = await SupportTicket.countDocuments({ status: "new" });
    const openTickets = await SupportTicket.countDocuments({ status: "open" });
    const inProgressTickets = await SupportTicket.countDocuments({ status: "in_progress" });
    const waitingCustomerTickets = await SupportTicket.countDocuments({ status: "waiting_customer" });
    const resolvedTickets = await SupportTicket.countDocuments({ status: "resolved" });
    const closedTickets = await SupportTicket.countDocuments({ status: "closed" });

    const highPriorityTickets = await SupportTicket.countDocuments({
      priority: { $in: ["high", "urgent"] },
      status: { $nin: ["resolved", "closed"] },
    });
    const unassignedTickets = await SupportTicket.countDocuments({
      assignedTo: null,
      status: { $nin: ["resolved", "closed"] },
    });
    const requiresResponseTickets = await SupportTicket.countDocuments({
      status: { $in: ["new", "open"] },
    });

    // Recent activity in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivityCount = await SupportTicket.countDocuments({
      lastMessageAt: { $gte: oneDayAgo },
    });

    res.json({
      success: true,
      data: {
        total: totalTickets,
        new: newTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        waitingCustomer: waitingCustomerTickets,
        resolved: resolvedTickets,
        closed: closedTickets,
        highPriority: highPriorityTickets,
        unassigned: unassignedTickets,
        requiresResponse: requiresResponseTickets,
        recentActivity: recentActivityCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/support/tickets
 * Admin: Paginated list of tickets with search, filters, and sorting
 */
async function getAdminTickets(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const {
      search,
      status,
      category,
      priority,
      assignedTo,
      sortBy = "lastMessageAt",
      sortOrder = "desc",
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    // Search by ticketNumber, name, email, phone, subject
    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { ticketNumber: regex },
        { name: regex },
        { email: regex },
        { phone: regex },
        { subject: regex },
      ];
    }

    if (status && status !== "all") {
      filter.status = status;
    }
    if (category && category !== "all") {
      filter.category = category;
    }
    if (priority && priority !== "all") {
      filter.priority = priority;
    }
    if (assignedTo && assignedTo !== "all") {
      filter.assignedTo = assignedTo === "unassigned" ? null : assignedTo;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [tickets, totalCount] = await Promise.all([
      SupportTicket.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("assignedTo", "name email")
        .populate("customer", "name email phone createdAt")
        .lean(),
      SupportTicket.countDocuments(filter),
    ]);

    // Attach latest message preview for each ticket
    const ticketIds = tickets.map((t) => t._id);
    const latestMessages = await SupportMessage.aggregate([
      { $match: { ticket: { $in: ticketIds }, noteType: { $ne: "system_event" } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$ticket",
          latestMessage: { $first: "$message" },
          senderType: { $first: "$senderType" },
          createdAt: { $first: "$createdAt" },
        },
      },
    ]);

    const latestMap = {};
    latestMessages.forEach((m) => {
      latestMap[m._id.toString()] = m;
    });

    const enriched = tickets.map((t) => ({
      ...t,
      latestMessage: latestMap[t._id.toString()]?.latestMessage || t.subject,
      latestSenderType: latestMap[t._id.toString()]?.senderType || "customer",
    }));

    res.json({
      success: true,
      data: {
        tickets: enriched,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/support/tickets/:id
 * Admin: Complete ticket workspace details, messages, customer history, internal notes
 */
async function getAdminTicketById(req, res, next) {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id)
      .populate("assignedTo", "name email role")
      .populate("customer", "name email phone createdAt addresses");

    if (!ticket) {
      const err = new Error("Support ticket not found");
      err.statusCode = 404;
      throw err;
    }

    // Fetch full chronological conversation thread (including internal notes, call logs, and system events)
    const messages = await SupportMessage.find({ ticket: ticket._id })
      .populate("sender", "name email role")
      .sort({ createdAt: 1 });

    // Customer profile info (total tickets created, member since)
    const [previousTicketsCount, otherTickets] = await Promise.all([
      SupportTicket.countDocuments({
        $or: [{ email: ticket.email }, ...(ticket.customer ? [{ customer: ticket.customer._id }] : [])],
      }),
      SupportTicket.find({
        _id: { $ne: ticket._id },
        $or: [{ email: ticket.email }, ...(ticket.customer ? [{ customer: ticket.customer._id }] : [])],
      })
        .select("ticketNumber subject status createdAt")
        .limit(5)
        .lean(),
    ]);

    const customerProfile = {
      isRegistered: !!ticket.customer,
      registeredAt: ticket.customer?.createdAt || null,
      totalTickets: previousTicketsCount,
      otherRecentTickets: otherTickets,
    };

    res.json({
      success: true,
      data: {
        ticket,
        messages,
        customerProfile,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/support/tickets/:id/reply
 * Admin: Reply to customer (via website and/or email)
 */
async function adminReply(req, res, next) {
  try {
    const { id } = req.params;
    const { message, channel = "website", sendEmailNotification = true, attachments = [] } = req.body;

    if (!message || !message.trim()) {
      const err = new Error("Reply message cannot be empty");
      err.statusCode = 400;
      throw err;
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      const err = new Error("Ticket not found");
      err.statusCode = 404;
      throw err;
    }

    const adminName = req.user.name || "Brundavanam Support";
    const adminEmail = req.user.email || "care@brundavanamgoshala.com";

    const newMessage = await SupportMessage.create({
      ticket: ticket._id,
      sender: req.user._id,
      senderType: "admin",
      senderName: adminName,
      senderEmail: adminEmail,
      message: message.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      channel: channel,
      isInternal: false,
      noteType: "message",
    });

    // Update ticket state
    ticket.lastMessageAt = new Date();
    ticket.lastAdminMessageAt = new Date();
    ticket.status = "waiting_customer";
    if (!ticket.assignedTo) {
      ticket.assignedTo = req.user._id;
    }
    await ticket.save();

    // Log timeline audit event
    await SupportMessage.create({
      ticket: ticket._id,
      sender: req.user._id,
      senderType: "system",
      senderName: "System",
      message: `Staff member ${adminName} replied via ${channel.toUpperCase()}${
        sendEmailNotification ? " and dispatched email notification to customer" : ""
      }.`,
      isInternal: false,
      noteType: "system_event",
      systemEventDetails: {
        action: "admin_reply",
        newValue: "waiting_customer",
      },
    });

    // Send customer email if requested
    let emailResult = null;
    if (sendEmailNotification) {
      try {
        emailResult = await emailService.sendAdminReplyEmail({ ticket, message: newMessage });
        console.log(`[supportController] Admin reply email result for ticket #${ticket.ticketNumber}:`, emailResult);
      } catch (e) {
        console.error("[supportController] Failed sending admin reply email:", e.message);
        emailResult = { success: false, error: e.message };
      }
    }

    res.status(201).json({
      success: true,
      message: newMessage,
      emailDispatched: emailResult?.success ?? false,
      emailError: emailResult?.error || null,
      ticket: {
        id: ticket._id,
        status: ticket.status,
        lastMessageAt: ticket.lastMessageAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/support/tickets/:id/internal-notes
 * Admin: Add private note (invisible to customer)
 */
async function adminAddInternalNote(req, res, next) {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      const err = new Error("Internal note content is required");
      err.statusCode = 400;
      throw err;
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      const err = new Error("Ticket not found");
      err.statusCode = 404;
      throw err;
    }

    const adminName = req.user.name || "Staff Member";

    const newNote = await SupportMessage.create({
      ticket: ticket._id,
      sender: req.user._id,
      senderType: "admin",
      senderName: adminName,
      senderEmail: req.user.email,
      message: note.trim(),
      channel: "website",
      isInternal: true,
      noteType: "internal_note",
    });

    ticket.internalNotesCount = (ticket.internalNotesCount || 0) + 1;
    await ticket.save();

    res.status(201).json({
      success: true,
      note: newNote,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/support/tickets/:id/call-notes
 * Admin: Log phone call with customer
 */
async function adminLogCall(req, res, next) {
  try {
    const { id } = req.params;
    const { phoneNumber, durationMinutes = 0, outcome = "answered", note } = req.body;

    if (!note || !note.trim()) {
      const err = new Error("Call summary/note is required");
      err.statusCode = 400;
      throw err;
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      const err = new Error("Ticket not found");
      err.statusCode = 404;
      throw err;
    }

    const adminName = req.user.name || "Staff Member";

    const callRecord = await SupportMessage.create({
      ticket: ticket._id,
      sender: req.user._id,
      senderType: "admin",
      senderName: adminName,
      senderEmail: req.user.email,
      message: note.trim(),
      channel: "phone",
      isInternal: true,
      noteType: "call_note",
      callDetails: {
        phoneNumber: phoneNumber || ticket.phone,
        durationMinutes: Number(durationMinutes) || 0,
        outcome: outcome,
      },
    });

    ticket.callNotesCount = (ticket.callNotesCount || 0) + 1;
    await ticket.save();

    // Log timeline event
    await SupportMessage.create({
      ticket: ticket._id,
      sender: req.user._id,
      senderType: "system",
      senderName: "System",
      message: `Phone call logged by ${adminName} (${outcome.replace(/_/g, " ")}, duration: ${durationMinutes} min).`,
      isInternal: false,
      noteType: "system_event",
      systemEventDetails: {
        action: "call_logged",
        newValue: outcome,
      },
    });

    res.status(201).json({
      success: true,
      callRecord,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/support/tickets/:id/status
 * Admin: Update ticket status
 */
async function adminUpdateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["new", "open", "in_progress", "waiting_customer", "resolved", "closed"];
    if (!status || !allowed.includes(status)) {
      const err = new Error(`Invalid status. Allowed values: ${allowed.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      const err = new Error("Ticket not found");
      err.statusCode = 404;
      throw err;
    }

    const prevStatus = ticket.status;
    ticket.status = status;

    if (status === "resolved") {
      ticket.resolvedAt = new Date();
      emailService.sendTicketResolvedEmail({ ticket }).catch((e) => console.error(e.message));
    } else if (status === "closed") {
      ticket.closedAt = new Date();
    } else {
      ticket.resolvedAt = null;
      ticket.closedAt = null;
    }

    await ticket.save();

    // Log system event
    await SupportMessage.create({
      ticket: ticket._id,
      sender: req.user._id,
      senderType: "system",
      senderName: "System",
      message: `Status updated from ${prevStatus.toUpperCase()} to ${status.toUpperCase()} by ${req.user.name || "Admin"}.`,
      isInternal: false,
      noteType: "system_event",
      systemEventDetails: {
        action: "status_changed",
        previousValue: prevStatus,
        newValue: status,
      },
    });

    res.json({
      success: true,
      ticket: {
        id: ticket._id,
        status: ticket.status,
        resolvedAt: ticket.resolvedAt,
        closedAt: ticket.closedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/support/tickets/:id/priority
 * Admin: Update ticket priority
 */
async function adminUpdatePriority(req, res, next) {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const allowed = ["low", "medium", "high", "urgent"];
    if (!priority || !allowed.includes(priority)) {
      const err = new Error(`Invalid priority. Allowed values: ${allowed.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      const err = new Error("Ticket not found");
      err.statusCode = 404;
      throw err;
    }

    const prevPriority = ticket.priority;
    ticket.priority = priority;
    await ticket.save();

    await SupportMessage.create({
      ticket: ticket._id,
      sender: req.user._id,
      senderType: "system",
      senderName: "System",
      message: `Priority updated from ${prevPriority.toUpperCase()} to ${priority.toUpperCase()} by ${req.user.name || "Admin"}.`,
      isInternal: false,
      noteType: "system_event",
      systemEventDetails: {
        action: "priority_changed",
        previousValue: prevPriority,
        newValue: priority,
      },
    });

    res.json({
      success: true,
      ticket: {
        id: ticket._id,
        priority: ticket.priority,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/support/tickets/:id/assign
 * Admin: Assign ticket to staff member
 */
async function adminAssignTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      const err = new Error("Ticket not found");
      err.statusCode = 404;
      throw err;
    }

    let assigneeName = "Unassigned";
    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        const err = new Error("Assignee user not found");
        err.statusCode = 404;
        throw err;
      }
      ticket.assignedTo = assignee._id;
      assigneeName = assignee.name || assignee.email || assignee.phone || "Staff Member";
    } else {
      ticket.assignedTo = null;
    }

    await ticket.save();

    const actorName = req.user?.name || req.user?.email || "Admin";

    await SupportMessage.create({
      ticket: ticket._id,
      sender: req.user._id,
      senderType: "system",
      senderName: "System",
      message: `Ticket assigned to ${assigneeName} by ${actorName}.`,
      isInternal: false,
      noteType: "system_event",
      systemEventDetails: {
        action: "ticket_assigned",
        newValue: assigneeName,
      },
    });

    res.json({
      success: true,
      ticket: {
        id: ticket._id,
        assignedTo: ticket.assignedTo,
        assigneeName,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/support/staff
 * Admin: Get list of staff users eligible for assignment
 */
async function getAdminStaffList(req, res, next) {
  try {
    const staff = await User.find({
      $or: [{ role: { $in: ["admin", "super_admin"] } }, { isAdmin: true }],
      isActive: true,
    })
      .select("name email role")
      .lean();

    res.json({
      success: true,
      data: staff,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/support/webhook/inbound-email
 * Safe webhook receiver for inbound email replies from email service providers
 */
async function inboundEmailWebhook(req, res, next) {
  try {
    const { from, subject, text, html } = req.body;

    if (!subject || !from) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Extract ticket number format: SUP-YYYY-XXXXXX
    const match = subject.match(/SUP-\d{4}-\d{6}/i);
    if (!match) {
      console.log("[supportWebhook] No ticket reference found in subject:", subject);
      return res.json({ success: false, message: "No ticket reference match" });
    }

    const ticketNumber = match[0].toUpperCase();
    const ticket = await SupportTicket.findOne({ ticketNumber });

    if (!ticket) {
      console.log(`[supportWebhook] Ticket #${ticketNumber} not found for inbound email`);
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const content = text || html || "Inbound message content received via email.";

    // Automatically reopen if closed
    if (ticket.status === "resolved" || ticket.status === "closed") {
      ticket.status = "open";
      ticket.resolvedAt = null;
      ticket.closedAt = null;
    } else if (ticket.status === "waiting_customer") {
      ticket.status = "in_progress";
    }

    ticket.lastMessageAt = new Date();
    ticket.lastCustomerMessageAt = new Date();
    await ticket.save();

    const message = await SupportMessage.create({
      ticket: ticket._id,
      senderType: "customer",
      senderName: ticket.name,
      senderEmail: from,
      message: content,
      channel: "email",
      isInternal: false,
      noteType: "message",
    });

    console.log(`[supportWebhook] Appended inbound email reply to ticket #${ticketNumber}`);

    res.json({ success: true, messageId: message._id });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/support/admin/smtp-status
 * Admin: Check Gmail SMTP connectivity and credential status
 */
async function getAdminSmtpStatus(req, res, next) {
  try {
    const status = await emailService.verifySmtp();
    res.json({
      success: true,
      data: status,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/support/admin/test-email
 * Admin: Send live verification email to test recipient
 */
async function sendAdminTestEmail(req, res, next) {
  try {
    const { recipientEmail } = req.body;
    const target = (recipientEmail || req.user.email || process.env.SUPPORT_EMAIL || "brundavanamgaushala@gmail.com").trim();

    if (!target) {
      const err = new Error("Recipient email address is required");
      err.statusCode = 400;
      throw err;
    }

    const result = await emailService.sendTestEmail({ to: target });

    if (!result.success) {
      const err = new Error(result.error || "Failed to dispatch test email via Gmail SMTP");
      err.statusCode = 500;
      throw err;
    }

    res.json({
      success: true,
      message: `Live test email successfully dispatched to ${target}!`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTicket,
  getGuestTicket,
  replyGuestTicket,
  getCustomerTickets,
  getCustomerTicketById,
  replyCustomerTicket,
  getAdminSupportStats,
  getAdminTickets,
  getAdminTicketById,
  adminReply,
  adminAddInternalNote,
  adminLogCall,
  adminUpdateStatus,
  adminUpdatePriority,
  adminAssignTicket,
  getAdminStaffList,
  inboundEmailWebhook,
  getAdminSmtpStatus,
  sendAdminTestEmail,
};
