const nodemailer = require("nodemailer");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

async function sendEmail() {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: "jore24@autonoma.edu.pe",
      subject: "Error en las pruebas automatizadas",
      text: "¡Las pruebas automatizadas han fallado! Revisa el informe adjunto.",
      attachments: [
        {
          // path: __dirname + "/after-login.png",
          path: __dirname + "/../tests/screenshots/test2/after-click.png",
          filename: "after-login.png",
        },
        {
          path: __dirname + "/../tests/screenshots/test2/before-click.png",
          filename: "before-click.png",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("Email enviado correctamente");
  } catch (error) {
    console.error("Error al enviar el email:", error);
  }
}

module.exports = sendEmail;
