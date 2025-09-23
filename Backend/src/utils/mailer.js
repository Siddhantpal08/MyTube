// src/utils/mailer.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from a .env file into process.env
dotenv.config();

const sendEmail = async (options) => {
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, // e.g., 'smtp.gmail.com' or 'smtp.sendgrid.net'
        port: process.env.EMAIL_PORT, // e.g., 587 for TLS, 465 for SSL
        secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        },
        // For development, if you're using a self-signed certificate
        // or a testing email service without proper SSL setup:
        // tls: {
        //     rejectUnauthorized: false
        // }
    });

    // 2) Define the email options
    const mailOptions = {
        from: `MyTube Support <${process.env.EMAIL_FROM}>`, // Your "from" email address
        to: options.email,
        subject: options.subject,
        text: options.message,
        
    };

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
};

export default sendEmail;