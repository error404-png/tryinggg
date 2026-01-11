from agents.base import BaseAgent
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import re

class EmailSenderAgent(BaseAgent):
    def __init__(self, name: str = None, config: dict = None):
        super().__init__(name, config)
        self.config = config or {}
        # Default configuration
        self.EMAIL_USER = self.config.get("email_user", "manishramlani2004@gmail.com")
        self.EMAIL_PASS = self.config.get("email_pass", "vaqw dmpk mxgv uppa")
        self.SMTP_SERVER = self.config.get("smtp_server", "smtp.gmail.com")
        self.SMTP_PORT = int(self.config.get("smtp_port", 587))

    def run(self, message: str) -> str:
        """
        Sends an email based on the input message.
        Expected format in message:
        To: recipient@example.com
        Subject: Email Subject
        
        Body of the email...

        If headers are missing, it attempts to find an email address in the text (e.g. from Context).
        """
        try:
            # Parse the message
            lines = message.strip().split('\n')
            to_email = None
            subject = "No Subject"
            body_start_index = 0

            # 1. Try explicit headers
            for i, line in enumerate(lines):
                if line.lower().startswith("to:"):
                    to_email = line[3:].strip()
                elif line.lower().startswith("subject:"):
                    subject = line[8:].strip()
                elif line.strip() == "":
                    # Empty line denotes start of body
                    if to_email: # Only finalize header parsing if we found a To address
                        body_start_index = i + 1
                        break
            
            # 2. Fallback: Search for email in the entire text if not found in headers
            if not to_email:
                # Regex for email address
                email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', message)
                if email_match:
                    to_email = email_match.group(0)
                    # If we found it via regex, we assume the whole message is likely the body 
                    # or there's some mixed content. We'll use the whole message as body 
                    # but try to strip the found email if it looks like a directive? 
                    # For safety, let's just keep the body as is.
                    body_start_index = 0 
                else:
                    return "Error: Could not find a recipient email address. Please specify 'To: <email>' in the message or context."

            body = "\n".join(lines[body_start_index:])
            
            # 3. Clean up "Context:" from body if it was used for routing but shouldn't be in the email
            # (Optional, but might be nice. For now, let's leave it to avoid over-engineering)

            # Setup the MIME
            msg = MIMEMultipart()
            msg['From'] = self.EMAIL_USER
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            # Connect and send
            server = smtplib.SMTP(self.SMTP_SERVER, self.SMTP_PORT)
            server.starttls()
            server.login(self.EMAIL_USER, self.EMAIL_PASS)
            text = msg.as_string()
            server.sendmail(self.EMAIL_USER, to_email, text)
            server.quit()

            return f"Email sent successfully to {to_email} with subject '{subject}'."

        except Exception as e:
            return f"Error sending email: {e}"
