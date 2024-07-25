from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

import AccountCredentials


def main():
    email_creds = AccountCredentials.AccountCredentials()

    try:
        # Call the Gmail API
        service = build("gmail", "v1", credentials=email_creds.get_creds())
        results = service.users().labels().list(userId="me").execute()
        inbox_messages = service.users().messages().list(userId="me", includeSpamTrash=True, labelIds="Inbox")
        print(type(inbox_messages))

    except HttpError as error:
        # TODO(developer) - Handle errors from gmail API.
        print(f"An error occurred: {error}")


if __name__ == '__main__':
    main()
