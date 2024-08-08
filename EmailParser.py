# from google_auth_oauthlib.flow import InstalledAppFlow


class EmailParser:

    def __init__(self, service):
        self.unfiltered_messages = []
        results = service.users().messages().list(userId="me", includeSpamTrash=True, labelIds="INBOX").execute()
        msg_list = results['messages']
        batch = service.new_batch_http_request()
        for msg_dict in msg_list:
            batch.add(service.users().messages().get(userId='me', id=msg_dict['id'], format='metadata'),
                      self.__handle_response)
        batch.execute()

    def __handle_response(self, request_id, message, exception):
        if exception is not None:
            print(f"An error occurred for request {request_id}: {exception}")
        else:
            self.unfiltered_messages.append(message)

    def __filter_messages(self):
        filtered_messages = []
        for message in self.unfiltered_messages:
            payload = message['payload']
            print()

