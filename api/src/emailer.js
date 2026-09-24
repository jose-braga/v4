import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: "GandiMail",
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
})

export async function sendPasswordResetEmail(to, resetUrl) {
    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: 'LAQV/UCIBIO - Reset your password on data management platform',
        text: `We received a request to reset your password. Open this link to choose a new one (valid for 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
        html: `
            <p>We received a request to reset your password.</p>
            <p><a href="${resetUrl}">Click here to choose a new password</a> (valid for 1 hour).</p>
            <p>If you didn't request this, you can safely ignore this email.</p>

            <p>Best regards,<br/>LAQV/UCIBIO Platform</p>
        `,
    })
    console.log('Message %s sent: %s', info.messageId, info.response);
}