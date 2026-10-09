const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const { company, frontendUrl } = require("../config/env");
const gcsService = require("./gcsService");

class InvoiceService {
  /**
   * Format currency into Indian Rupees format (e.g. ₹ 1,250.00)
   */
  formatCurrency(amount) {
    return `INR ${(Number(amount) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Convert number into Indian words
   */
  numberToWords(num) {
    const a = [
      "",
      "One ",
      "Two ",
      "Three ",
      "Four ",
      "Five ",
      "Six ",
      "Seven ",
      "Eight ",
      "Nine ",
      "Ten ",
      "Eleven ",
      "Twelve ",
      "Thirteen ",
      "Fourteen ",
      "Fifteen ",
      "Sixteen ",
      "Seventeen ",
      "Eighteen ",
      "Nineteen ",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const n = Math.floor(num);
    if (n === 0) return "Zero Rupees Only";

    function inWords(n) {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
      if (n < 1000)
        return (
          a[Math.floor(n / 100)] +
          "Hundred " +
          (n % 100 !== 0 ? "and " + inWords(n % 100) : "")
        );
      if (n < 100000)
        return (
          inWords(Math.floor(n / 1000)) +
          "Thousand " +
          (n % 1000 !== 0 ? inWords(n % 1000) : "")
        );
      if (n < 10000000)
        return (
          inWords(Math.floor(n / 100000)) +
          "Lakh " +
          (n % 100000 !== 0 ? inWords(n % 100000) : "")
        );
      return (
        inWords(Math.floor(n / 10000000)) +
        "Crore " +
        (n % 10000000 !== 0 ? inWords(n % 10000000) : "")
      );
    }

    return `Rupees ${inWords(n).trim()} Only`;
  }

  /**
   * Generate sequential or date-based invoice number
   */
  generateInvoiceNumber(order) {
    const year = new Date().getFullYear();
    const cleanNum = (order.orderNumber || "").replace(/[^0-9]/g, "").slice(-5) || "0001";
    return `BG-INV-${year}-${cleanNum}`;
  }

  /**
   * Build PDF Document Buffer
   */
  async buildPdfBuffer(order, invoiceNumber, invoiceDate) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const primaryColor = "#A9762F"; // Temple Brass
      const darkColor = "#1F2E22";    // Deep Pasture
      const mutedColor = "#666666";
      const lightBg = "#FAF6ED";      // Warm Ivory

      // --- HEADER ---
      doc
        .fillColor(primaryColor)
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(company.name.toUpperCase(), 40, 40)
        .fontSize(8)
        .font("Helvetica")
        .fillColor(mutedColor)
        .text(company.legalName, 40, 65)
        .text(company.address, 40, 77, { width: 300 })
        .text(`GSTIN: ${company.gstin} | PAN: ${company.pan}`, 40, 100)
        .text(`Email: ${company.email} | Phone: ${company.phone}`, 40, 112);

      // Tax Invoice Label (Right side)
      doc
        .fillColor(primaryColor)
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("TAX INVOICE", 400, 40, { align: "right" })
        .fontSize(9)
        .font("Helvetica")
        .fillColor(darkColor)
        .text(`Invoice No: ${invoiceNumber}`, 400, 65, { align: "right" })
        .text(`Invoice Date: ${new Date(invoiceDate).toLocaleDateString("en-IN")}`, 400, 80, { align: "right" })
        .text(`Order No: ${order.orderNumber}`, 400, 95, { align: "right" })
        .text(`Payment: ${order.payment.status.toUpperCase()} (${order.payment.provider})`, 400, 110, { align: "right" });

      doc
        .strokeColor("#E4DAC5")
        .lineWidth(1)
        .moveTo(40, 130)
        .lineTo(555, 130)
        .stroke();

      // --- BILL TO & SHIP TO ---
      const yBill = 145;
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text("BILLED TO:", 40, yBill)
        .font("Helvetica")
        .fillColor(darkColor)
        .text(order.billingAddress.fullName, 40, yBill + 15)
        .text(order.billingAddress.line1, 40, yBill + 28)
        .text(`${order.billingAddress.city}, ${order.billingAddress.state} - ${order.billingAddress.postalCode}`, 40, yBill + 41)
        .text(`Phone: ${order.billingAddress.phone}`, 40, yBill + 54);

      doc
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text("SHIPPED TO:", 320, yBill)
        .font("Helvetica")
        .fillColor(darkColor)
        .text(order.shippingAddress.fullName, 320, yBill + 15)
        .text(order.shippingAddress.line1, 320, yBill + 28)
        .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`, 320, yBill + 41)
        .text(`Phone: ${order.shippingAddress.phone}`, 320, yBill + 54);

      doc
        .strokeColor("#E4DAC5")
        .lineWidth(1)
        .moveTo(40, yBill + 75)
        .lineTo(555, yBill + 75)
        .stroke();

      // --- ITEM TABLE HEADER ---
      let yTable = yBill + 90;
      doc
        .rect(40, yTable, 515, 20)
        .fill(lightBg);

      doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("#", 45, yTable + 6)
        .text("ITEM DESCRIPTION", 65, yTable + 6)
        .text("HSN", 250, yTable + 6)
        .text("QTY", 310, yTable + 6, { width: 30, align: "center" })
        .text("RATE", 355, yTable + 6, { width: 55, align: "right" })
        .text("GST", 420, yTable + 6, { width: 45, align: "right" })
        .text("TOTAL", 480, yTable + 6, { width: 70, align: "right" });

      yTable += 25;
      doc.font("Helvetica").fontSize(8).fillColor(darkColor);

      order.items.forEach((item, index) => {
        const itemTitle = item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name;
        const rate = (item.finalPrice || item.price);
        const gst = item.gstAmount || Math.round(rate * item.quantity * 0.05);
        const total = item.subtotal || (rate * item.quantity);

        doc
          .text(String(index + 1), 45, yTable)
          .text(itemTitle.slice(0, 36), 65, yTable, { width: 180 })
          .text(item.hsnCode || "04059020", 250, yTable)
          .text(String(item.quantity), 310, yTable, { width: 30, align: "center" })
          .text(rate.toFixed(2), 355, yTable, { width: 55, align: "right" })
          .text(gst.toFixed(2), 420, yTable, { width: 45, align: "right" })
          .text(total.toFixed(2), 480, yTable, { width: 70, align: "right" });

        yTable += 20;

        // Bottom hairline
        doc
          .strokeColor("#F0ECE1")
          .lineWidth(0.5)
          .moveTo(40, yTable - 4)
          .lineTo(555, yTable - 4)
          .stroke();
      });

      // --- TOTALS SUMMARY ---
      yTable += 10;
      const xLabel = 360;
      const xVal = 480;

      doc
        .fontSize(8)
        .font("Helvetica")
        .text("Items Subtotal:", xLabel, yTable)
        .text(this.formatCurrency(order.pricing.itemsTotal), xVal, yTable, { width: 70, align: "right" });

      yTable += 15;
      if (order.pricing.discountAmount > 0) {
        doc
          .text(`Discount (${order.pricing.couponCode || "Promo"}):`, xLabel, yTable)
          .text(`- ${this.formatCurrency(order.pricing.discountAmount)}`, xVal, yTable, { width: 70, align: "right" });
        yTable += 15;
      }

      doc
        .text("Applicable GST (Included):", xLabel, yTable)
        .text(this.formatCurrency(order.pricing.taxTotal), xVal, yTable, { width: 70, align: "right" });

      yTable += 15;
      doc
        .text("Shipping & Handling:", xLabel, yTable)
        .text(
          order.pricing.shippingFee > 0 ? this.formatCurrency(order.pricing.shippingFee) : "FREE",
          xVal,
          yTable,
          { width: 70, align: "right" }
        );

      yTable += 15;
      doc
        .rect(xLabel - 10, yTable, 205, 24)
        .fill(lightBg);

      doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("GRAND TOTAL:", xLabel, yTable + 6)
        .text(this.formatCurrency(order.pricing.grandTotal), xVal - 10, yTable + 6, { width: 80, align: "right" });

      // Amount in words
      yTable += 35;
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(mutedColor)
        .text("Amount in Words:", 40, yTable)
        .font("Helvetica-Bold")
        .fillColor(darkColor)
        .text(this.numberToWords(order.pricing.grandTotal), 40, yTable + 12);

      // --- FOOTER & DECLARATION ---
      const yFooter = 720;
      doc
        .strokeColor("#E4DAC5")
        .lineWidth(1)
        .moveTo(40, yFooter)
        .lineTo(555, yFooter)
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(mutedColor)
        .text("Terms & Conditions:", 40, yFooter + 8)
        .text("1. All goshala dairy & authentic products are crafted traditionally with zero adulteration.", 40, yFooter + 18)
        .text("2. Returns or damaged transit claims must be reported within 48 hours of delivery with photographic evidence.", 40, yFooter + 28)
        .text("This is a computer-generated invoice and requires no physical signature.", 40, yFooter + 42);

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text(`For ${company.legalName}`, 400, yFooter + 8, { align: "right" })
        .font("Helvetica")
        .fillColor(mutedColor)
        .text("Authorized Signatory", 400, yFooter + 42, { align: "right" });

      doc.end();
    });
  }

  /**
   * Generates Invoice, uploads to Google Cloud Storage (or creates static URL), and updates Order
   */
  async generateAndUploadInvoice(order) {
    try {
      const invoiceNumber = order.invoice?.invoiceNumber || this.generateInvoiceNumber(order);
      const invoiceDate = order.invoice?.invoiceDate || new Date();

      const pdfBuffer = await this.buildPdfBuffer(order, invoiceNumber, invoiceDate);

      let invoiceUrl = `${frontendUrl}/orders/${order._id}/invoice`;
      let fileId = `inv_${order._id}`;

      // Upload directly to Google Cloud Storage
      try {
        const uploadResult = await gcsService.uploadFileDirect({
          buffer: pdfBuffer,
          fileName: `invoice-${order.orderNumber}.pdf`,
          mimeType: "application/pdf",
          fileType: "pdf",
        });

        if (uploadResult?.publicUrl) {
          invoiceUrl = uploadResult.publicUrl;
          fileId = uploadResult.fileId;
        }
      } catch (gcsErr) {
        console.warn(
          "[InvoiceService] GCS upload skipped or failed, fallback to direct stream URL:",
          gcsErr.message
        );
      }

      return {
        invoiceNumber,
        invoiceDate,
        invoiceUrl,
        fileId,
        pdfBuffer,
      };
    } catch (err) {
      console.error("[InvoiceService] Failed to generate invoice:", err);
      throw err;
    }
  }
}

module.exports = new InvoiceService();
