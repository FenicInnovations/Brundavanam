const NewsletterSubscriber = require("../models/NewsletterSubscriber");
const {
  sendNewsletterWelcomeEmail,
  sendNewsletterBroadcastEmail,
} = require("../services/emailService");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public: Subscribe to newsletter (typically from footer)
 * POST /api/newsletter/subscribe
 */
async function subscribe(req, res, next) {
  try {
    const rawEmail = req.body?.email;
    if (!rawEmail || typeof rawEmail !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const email = rawEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format. Please check and try again.",
      });
    }

    const source = req.body.source || "footer";
    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket?.remoteAddress || req.ip || null;
    const userAgent = req.headers["user-agent"] || null;

    let subscriber = await NewsletterSubscriber.findOne({ email });

    if (subscriber) {
      if (subscriber.status === "active") {
        return res.status(200).json({
          success: true,
          isAlreadySubscribed: true,
          message:
            "You are already subscribed to the Brundavanam Goshala newsletter! Thank you for your continued devotion.",
          data: subscriber,
        });
      }

      // If previously unsubscribed, reactivate
      subscriber.status = "active";
      subscriber.subscribedAt = new Date();
      subscriber.unsubscribedAt = null;
      if (source) subscriber.source = source;
      await subscriber.save();

      // Attempt sending welcome email asynchronously
      sendNewsletterWelcomeEmail({ email }).catch((err) =>
        console.warn("[Newsletter] Reactivation welcome email failed:", err.message)
      );

      return res.status(200).json({
        success: true,
        message:
          "Welcome back! Your subscription to Brundavanam Goshala has been reactivated successfully.",
        data: subscriber,
      });
    }

    // Create new subscriber
    subscriber = await NewsletterSubscriber.create({
      email,
      status: "active",
      source,
      ipAddress: typeof ipAddress === "string" ? ipAddress.slice(0, 45) : null,
      userAgent: typeof userAgent === "string" ? userAgent.slice(0, 255) : null,
      subscribedAt: new Date(),
    });

    // Send welcome email asynchronously
    sendNewsletterWelcomeEmail({ email }).catch((err) =>
      console.warn("[Newsletter] New subscriber welcome email failed:", err.message)
    );

    return res.status(201).json({
      success: true,
      message:
        "Thank you for subscribing to Brundavanam Goshala newsletter! Check your inbox for updates and offers.",
      data: subscriber,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Public: Unsubscribe from newsletter
 * POST /api/newsletter/unsubscribe
 */
async function unsubscribe(req, res, next) {
  try {
    const rawEmail = req.body?.email;
    if (!rawEmail || typeof rawEmail !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email address is required to unsubscribe.",
      });
    }

    const email = rawEmail.trim().toLowerCase();
    const subscriber = await NewsletterSubscriber.findOne({ email });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscription record not found for this email.",
      });
    }

    subscriber.status = "unsubscribed";
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    return res.status(200).json({
      success: true,
      message: "You have been unsubscribed from Brundavanam Goshala newsletter updates.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get list of subscribers with pagination and filtering
 * GET /api/newsletter/admin/subscribers
 */
async function getAdminSubscribers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, status, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { email: { $regex: q, $options: "i" } },
        { notes: { $regex: q, $options: "i" } },
        { source: { $regex: q, $options: "i" } },
      ];
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [subscribers, total] = await Promise.all([
      NewsletterSubscriber.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      NewsletterSubscriber.countDocuments(filter),
    ]);

    // Aggregate overall KPI metrics
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAll, totalActive, totalUnsubscribed, todayCount, thisMonthCount] =
      await Promise.all([
        NewsletterSubscriber.countDocuments({}),
        NewsletterSubscriber.countDocuments({ status: "active" }),
        NewsletterSubscriber.countDocuments({ status: "unsubscribed" }),
        NewsletterSubscriber.countDocuments({ subscribedAt: { $gte: startOfToday } }),
        NewsletterSubscriber.countDocuments({ subscribedAt: { $gte: startOfMonth } }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        subscribers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
        stats: {
          total: totalAll,
          active: totalActive,
          unsubscribed: totalUnsubscribed,
          today: todayCount,
          thisMonth: thisMonthCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get Newsletter summary & growth chart stats
 * GET /api/newsletter/admin/stats
 */
async function getAdminNewsletterStats(req, res, next) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, active, unsubscribed, today, thisMonth] = await Promise.all([
      NewsletterSubscriber.countDocuments({}),
      NewsletterSubscriber.countDocuments({ status: "active" }),
      NewsletterSubscriber.countDocuments({ status: "unsubscribed" }),
      NewsletterSubscriber.countDocuments({ subscribedAt: { $gte: startOfToday } }),
      NewsletterSubscriber.countDocuments({ subscribedAt: { $gte: startOfMonth } }),
    ]);

    // Daily growth for last 14 days
    const dailyGrowth = await NewsletterSubscriber.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Source breakdown
    const sourceBreakdown = await NewsletterSubscriber.aggregate([
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        active,
        unsubscribed,
        today,
        thisMonth,
        dailyGrowth,
        sourceBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update subscriber status, notes, or tags
 * PATCH /api/newsletter/admin/:id
 */
async function updateSubscriber(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes, tags } = req.body;

    const subscriber = await NewsletterSubscriber.findById(id);
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found",
      });
    }

    if (status && ["active", "unsubscribed"].includes(status)) {
      subscriber.status = status;
      if (status === "unsubscribed") {
        subscriber.unsubscribedAt = new Date();
      } else {
        subscriber.unsubscribedAt = null;
      }
    }

    if (typeof notes === "string") {
      subscriber.notes = notes.trim();
    }

    if (Array.isArray(tags)) {
      subscriber.tags = tags.map((t) => String(t).trim()).filter(Boolean);
    }

    await subscriber.save();

    return res.status(200).json({
      success: true,
      message: "Subscriber updated successfully",
      data: subscriber,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Delete subscriber permanently
 * DELETE /api/newsletter/admin/:id
 */
async function deleteSubscriber(req, res, next) {
  try {
    const { id } = req.params;
    const subscriber = await NewsletterSubscriber.findByIdAndDelete(id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscriber removed permanently",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Export subscribers as CSV
 * GET /api/newsletter/admin/export
 */
async function exportSubscribers(req, res, next) {
  try {
    const status = req.query.status || "active";
    const filter = status === "all" ? {} : { status };

    const subscribers = await NewsletterSubscriber.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const headers = "Email,Status,Source,Tags,Subscribed Date,Notes\n";
    const rows = subscribers
      .map((s) => {
        const email = `"${s.email || ""}"`;
        const stat = `"${s.status || ""}"`;
        const src = `"${s.source || ""}"`;
        const tags = `"${(s.tags || []).join("; ")}"`;
        const date = `"${s.subscribedAt ? new Date(s.subscribedAt).toISOString() : ""}"`;
        const notes = `"${(s.notes || "").replace(/"/g, '""')}"`;
        return `${email},${stat},${src},${tags},${date},${notes}`;
      })
      .join("\n");

    const csvContent = headers + rows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="brundavanam-subscribers-${Date.now()}.csv"`
    );
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Broadcast email announcement to active subscribers or test email
 * POST /api/newsletter/admin/broadcast
 */
async function broadcastNewsletter(req, res, next) {
  try {
    const { subject, message, testEmailOnly, actionUrl, actionText } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject line is required.",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message body is required.",
      });
    }

    // If test email only
    if (testEmailOnly) {
      const targetEmail =
        typeof testEmailOnly === "string" && EMAIL_REGEX.test(testEmailOnly.trim())
          ? testEmailOnly.trim()
          : req.user?.email || process.env.ADMIN_NOTIFICATION_EMAIL || "brundavanamgaushala@gmail.com";

      await sendNewsletterBroadcastEmail({
        to: targetEmail,
        subject: `[TEST BROADCAST] ${subject.trim()}`,
        message: message.trim(),
        actionUrl,
        actionText,
      });

      return res.status(200).json({
        success: true,
        message: `Test broadcast email sent successfully to ${targetEmail}!`,
      });
    }

    // Broadcast to all active subscribers
    const activeSubscribers = await NewsletterSubscriber.find({ status: "active" })
      .select("email")
      .lean();

    if (!activeSubscribers || activeSubscribers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active subscribers found to broadcast to.",
      });
    }

    // Dispatch in batches asynchronously so HTTP response doesn't hang
    let dispatched = 0;
    const errors = [];

    // Process asynchronously
    (async () => {
      for (const sub of activeSubscribers) {
        try {
          await sendNewsletterBroadcastEmail({
            to: sub.email,
            subject: subject.trim(),
            message: message.trim(),
            actionUrl,
            actionText,
          });
          dispatched++;
          // Small pause between emails to respect SMTP limits
          await new Promise((r) => setTimeout(r, 150));
        } catch (err) {
          errors.push({ email: sub.email, error: err.message });
        }
      }
      console.log(
        `[Newsletter Broadcast] Completed: Dispatched ${dispatched}/${activeSubscribers.length} emails.`
      );
    })().catch((err) => {
      console.error("[Newsletter Broadcast] Background dispatch error:", err);
    });

    return res.status(200).json({
      success: true,
      message: `Broadcast queue started for ${activeSubscribers.length} active devotees. Emails are being delivered now.`,
      recipientCount: activeSubscribers.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  subscribe,
  unsubscribe,
  getAdminSubscribers,
  getAdminNewsletterStats,
  updateSubscriber,
  deleteSubscriber,
  exportSubscribers,
  broadcastNewsletter,
};
