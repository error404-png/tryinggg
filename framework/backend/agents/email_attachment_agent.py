from agents.base import BaseAgent
import imaplib
import email
import os
import time
import datetime
from email.header import decode_header
from langchain_community.document_loaders import PyPDFLoader

class EmailDownloaderAgent(BaseAgent):
    def __init__(self, name: str = None, config: dict = None):
        super().__init__(name, config)
        self.config = config or {}
        # Default configuration (User should update these via UI or Code)
        self.EMAIL_USER = self.config.get("email_user", "manishramlani2004@gmail.com") 
        self.EMAIL_PASS = self.config.get("email_pass", "vaqw dmpk mxgv uppa")
        self.IMAP_SERVER = self.config.get("imap_server", "imap.gmail.com")
        
        # Folder to save documents - relative to backend or absolute
        self.OUTPUT_FOLDER = self.config.get("output_folder", "email_attachments")

    def clean_filename(self, filename):
        """Cleans the filename to prevent errors."""
        if not filename: return "untitled"
        return "".join(c for c in filename if c.isalnum() or c in (' ', '.', '_', '-')).strip()

    def run(self, message: str) -> str:
        """
        Connects to email, searches for today's UNSEEN emails, downloads attachments,
        and returns the EXTRACTED TEXT from them for chaining.
        """
        downloaded_files = []
        status_log = []
        extracted_text_content = ""

        if not os.path.exists(self.OUTPUT_FOLDER):
            try:
                os.makedirs(self.OUTPUT_FOLDER)
            except Exception as e:
                return f"Error creating output folder: {e}"

        mail = None
        try:
            # 1. Connect
            status_log.append(f"Connecting to {self.IMAP_SERVER} as {self.EMAIL_USER}...")
            mail = imaplib.IMAP4_SSL(self.IMAP_SERVER)
            mail.login(self.EMAIL_USER, self.EMAIL_PASS)
            mail.select("INBOX")

            # 2. Search for ALL emails from TODAY (SEEN or UNSEEN)
            # This ensures that even if an email is opened elsewhere, we still process it if it's from today.
            # Date format: 11-Jan-2026
            today_str = datetime.datetime.now().strftime("%d-%b-%Y")
            search_criteria = f'(SINCE "{today_str}")'
            
            status, messages = mail.search(None, search_criteria)
            email_ids = messages[0].split()

            if not email_ids:
                return f"Connected successfully. No new unread emails found for today ({today_str})."
            
            status_log.append(f"Found {len(email_ids)} new emails for today. Processing...")

            for email_id in email_ids:
                # Fetch email
                res, msg = mail.fetch(email_id, "(RFC822)")
                for response in msg:
                    if isinstance(response, tuple):
                        msg = email.message_from_bytes(response[1])
                        subject, encoding = decode_header(msg["Subject"])[0]
                        if isinstance(subject, bytes):
                            subject = subject.decode(encoding if encoding else "utf-8")

                        # Check for attachments
                        for part in msg.walk():
                            if part.get_content_maintype() == 'multipart':
                                continue
                            if part.get("Content-Disposition") is None:
                                continue

                            filename = part.get_filename()
                            if filename:
                                # Decode and clean filename
                                fname, fencoding = decode_header(filename)[0]
                                if isinstance(fname, bytes):
                                    filename = fname.decode(fencoding if fencoding else "utf-8")
                                filename = self.clean_filename(filename)
                                
                                filepath = os.path.join(self.OUTPUT_FOLDER, filename)
                                
                                # Save file
                                with open(filepath, "wb") as f:
                                    f.write(part.get_payload(decode=True))
                                
                                downloaded_files.append(filename)
                                status_log.append(f"Downloaded: {filename} from '{subject}'")
                                
                                # EXTRACT TEXT
                                try:
                                    if filename.lower().endswith(".pdf"):
                                        loader = PyPDFLoader(filepath)
                                        pages = loader.load()
                                        text = "\n".join([p.page_content for p in pages])
                                        extracted_text_content += f"\n\n--- Content of {filename} ---\n{text}"
                                    elif filename.lower().endswith(".txt"):
                                        with open(filepath, "r", encoding="utf-8") as f:
                                            extracted_text_content += f"\n\n--- Content of {filename} ---\n{f.read()}"
                                    else:
                                        extracted_text_content += f"\n\n--- File {filename} (Not supported for text extraction) ---"
                                except Exception as e:
                                    extracted_text_content += f"\n\n--- Error reading {filename}: {e} ---"

        except imaplib.IMAP4.error as e:
            return f"IMAP Error: {e}. Please check your credentials."
        except Exception as e:
            return f"Error: {e}"
        
        finally:
            if mail:
                try:
                    mail.close()
                    mail.logout()
                except:
                    pass

        if not downloaded_files:
            return "\n".join(status_log) + "\nNo attachments found in the new emails."
        
        if extracted_text_content:
             # Return the CONTENT so the next agent can use it
             return f"{extracted_text_content}"
        
        return "\n".join(status_log) + f"\nSuccessfully downloaded {len(downloaded_files)} attachments to '{self.OUTPUT_FOLDER}'."
