from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

import AccountCredentials
import EmailParser

messages = []


def main():

    account_creds = AccountCredentials.AccountCredentials()
    email_creds = account_creds.get_creds()

    try:
        # Call the Gmail API
        service = build("gmail", "v1", credentials=email_creds)
        parser = EmailParser.EmailParser(service)

    except HttpError as error:
        # TODO(developer) - Handle errors from gmail API.
        print(f"An error occurred: {error}")


if __name__ == '__main__':
    main()
