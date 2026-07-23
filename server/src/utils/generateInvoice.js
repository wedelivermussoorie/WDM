const PDFDocument = require('pdfkit');

function generateInvoice(order, user) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- Header ---
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('TAX INVOICE', { align: 'center' })
        .moveDown();

      // --- Company Info ---
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('ENNOBLE GLOBAL SERVICES.', 50, 90)
        .font('Helvetica')
        .text('GSTIN: 5AALFE8525D1ZJ')
        .text('Mussoorie, Uttarakhand, India')
        .text('Email: info@wedelivermussoorie.com');

      // --- Order Info ---
      const date = new Date(order.createdAt).toLocaleDateString();
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Order Number: #${order._id.toString().slice(-8).toUpperCase()}`, 400, 90)
        .font('Helvetica')
        .text(`Order Date: ${date}`, 400, 105)
        .text(`Payment: ${order.paymentMethod}`, 400, 120);

      doc.moveDown(3);

      // --- Billing/Shipping Details ---
      doc.font('Helvetica-Bold').text('Billed To:', 50, 160);
      doc.font('Helvetica')
         .text(user.name, 50, 175)
         .text(user.email, 50, 190)
         .text(order.shippingAddress?.phone || user.phone || '', 50, 205);

      if (order.shippingAddress) {
        doc.font('Helvetica-Bold').text('Shipped To:', 300, 160);
        doc.font('Helvetica')
           .text(order.shippingAddress.fullName || user.name, 300, 175)
           .text(`${order.shippingAddress.street || order.shippingAddress.line1 || ''}`, 300, 190)
           .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 300, 205);
      }

      doc.moveDown(3);

      // --- Table Header ---
      const tableTop = 270;
      doc.font('Helvetica-Bold');
      generateTableRow(doc, tableTop, 'Item', 'Qty', 'Price', 'Total');
      generateHr(doc, tableTop + 20);

      // --- Items ---
      let i = 0;
      let currentY = tableTop + 30;
      doc.font('Helvetica');
      for (i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        
        // Add a new page if the table is going out of bounds
        if (currentY > 700) {
           doc.addPage();
           currentY = 50;
           doc.font('Helvetica-Bold');
           generateTableRow(doc, currentY, 'Item', 'Qty', 'Price', 'Total');
           generateHr(doc, currentY + 20);
           currentY += 30;
           doc.font('Helvetica');
        }

        generateTableRow(
          doc,
          currentY,
          item.name,
          item.quantity.toString(),
          `Rs ${item.price.toFixed(2)}`,
          `Rs ${(item.price * item.quantity).toFixed(2)}`
        );
        currentY += 20;
      }

      // --- Totals ---
      const subtotalPosition = currentY + 10;
      generateHr(doc, subtotalPosition);
      doc.font('Helvetica-Bold');
      generateTableRow(
        doc,
        subtotalPosition + 10,
        '',
        '',
        'Total Amount:',
        `Rs ${order.totalAmount.toFixed(2)}`
      );

      doc.moveDown(4);
      doc.font('Helvetica')
         .fontSize(10)
         .text('Thank you for shopping with We Deliver Mussoorie!', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function generateTableRow(doc, y, item, qty, price, total) {
  doc
    .fontSize(10)
    .text(item, 50, y, { width: 230 })
    .text(qty, 300, y, { width: 50, align: 'center' })
    .text(price, 370, y, { width: 70, align: 'right' })
    .text(total, 470, y, { width: 70, align: 'right' });
}

function generateHr(doc, y) {
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(540, y).stroke();
}

module.exports = generateInvoice;
