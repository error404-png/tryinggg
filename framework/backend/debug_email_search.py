import imaplib
import email
import datetime
from email.header import decode_header

# Config
EMAIL_USER = "manishramlani2004@gmail.com"
EMAIL_PASS = "vaqw dmpk mxgv uppa"
IMAP_SERVER = "imap.gmail.com"

def debug_email_search():
    try:
        print(f"Connecting to {IMAP_SERVER}...")
        mail = imaplib.IMAP4_SSL(IMAP_SERVER)
        mail.login(EMAIL_USER, EMAIL_PASS)
        mail.select("INBOX")

        today_str = datetime.datetime.now().strftime("%d-%b-%Y")
        print(f"Searching for emails SINCE {today_str}...")

        # Search ALL emails from today
        search_criteria = f'(SINCE "{today_str}")'
        status, messages = mail.search(None, search_criteria)
        email_ids = messages[0].split()

        print(f"Total emails found from today: {len(email_ids)}")

        if not email_ids:
            print("No emails found at all for today.")
            return

        for email_id in email_ids:
            # Fetch headers AND flags
            res, msg_data = mail.fetch(email_id, "(RFC822.HEADER FLAGS)")
            
            # Print full structure to debug
            print(f"--- Debugging Email ID {email_id.decode()} ---")
            print(f"Full msg_data: {msg_data}")

            flags = b""
            subject = "Unknown"
            
            for response in msg_data:
                if isinstance(response, tuple):
                    # Tuple usually contains (header_section, payload)
                    # The FLAGS might be in the first part string: b'ID (RFC... FLAGS (\Seen))'
                    
                    # 1. Parse Subject from payload
                    msg = email.message_from_bytes(response[1])
                    sub, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(sub, bytes):
                        subject = sub.decode(encoding if encoding else "utf-8")
                    else:
                        subject = sub
                    
                    # 2. Extract Flags from the intro string response[0]
                    intro_str = response[0]
                    if b'FLAGS' in intro_str:
                         # e.g. b'8231 (RFC822.HEADER {5136} FLAGS (\Seen))'
                         # But sometimes FLAGS is separate.
                         pass

                elif isinstance(response, bytes):
                    # Sometimes flags come as a separate byte item in the list
                    # e.g. b'8231 FLAGS (\Seen)'
                    if b'FLAGS' in response:
                        flags = response

            print(f"Subject: '{subject}'")
            
            # Check for \Seen in ANY part of msg_data
            is_read = False
            full_dump = str(msg_data) 
            if '\\Seen' in full_dump or '\\\\Seen' in full_dump:
                 is_read = True

            if is_read:
                print("   -> Status: READ (Agent will SKIP this)")
            else:
                print("   -> Status: UNREAD (Agent SHOULD download this)")

        mail.close()
        mail.logout()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_email_search()
