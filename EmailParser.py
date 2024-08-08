# from google_auth_oauthlib.flow import InstalledAppFlow
import base64


class EmailParser:

    def __init__(self, service):
        self.unfiltered_messages = []
        self.filtered_messages = []
        results = (service.users().messages().list(userId="me", includeSpamTrash=True, labelIds="INBOX", maxResults=1)
                   .execute())
        msg_list = results['messages']
        batch = service.new_batch_http_request()
        for msg_dict in msg_list:
            batch.add(service.users().messages().get(userId='me', id=msg_dict['id'], format="full"),
                      self.__handle_response)
        batch.execute()
        self.__filter_messages()

    def __handle_response(self, request_id, message, exception):
        if exception is not None:
            print(f"An error occurred for request {request_id}: {exception}")
        else:
            self.unfiltered_messages.append(message)

    # As of now, filtering the body of the email
    def __filter_messages(self):
        for message in self.unfiltered_messages:
            decoded_message = {}
            payload = message['payload']
            parts = payload['parts']
            for part in parts:
                if part['mimeType'] == 'text/plain' or part['mimeType'] == 'text/html':
                    encoded_text = part['body']['data']
                    decoded_text = base64.urlsafe_b64decode(encoded_text).decode('utf-8')
                    decoded_message['partId'] = part['partId']
                    decoded_message['body'] = decoded_text

            self.filtered_messages.append(decoded_message)

    # For testing purposes
    def get_first_message(self):
        return self.filtered_messages[0]
