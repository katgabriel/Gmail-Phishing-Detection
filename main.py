from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

import AccountCredentials


def main():
    email_creds = AccountCredentials.AccountCredentials().get_creds()

    try:
        # Call the Gmail API
        service = build("gmail", "v1", credentials=email_creds)
        results = service.users().messages().list(userId="me", includeSpamTrash=True, labelIds="INBOX").execute()
        messages = results["messages"]

    except HttpError as error:
        # TODO(developer) - Handle errors from gmail API.
        print(f"An error occurred: {error}")


if __name__ == '__main__':
    main()
