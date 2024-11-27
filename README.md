# Splitwise Clone

A comprehensive expense management application designed to help users manage group expenses, split bills, and track debts among friends or groups. This application offers features for managing expenses, facilitating settlements, and enabling seamless communication.

## Features

### User Management

- OTP-based user registration and login.
- Role-based authentication and authorization (admin and user roles).
- Profile picture upload with secure storage on AWS S3.

### Group Management

- Create and manage groups with unique identifiers.
- Group admin functionality, including restricted access to update group details.

### Expense Management

- Add, view, and manage expenses within groups or between two users.
- Settle expenses with a dedicated API endpoint.
- Threaded comments for expenses, with CRUD operations restricted to the comment creator.

### Friends and Connections

- Manage a friends list using the `FriendList` model.
- Support for soft deletion of friendships.

### Communication and Notifications

- User chat for groups and expenses.
- Email notifications for group activities, expense updates, and settlements via Nodemailer.

---

## Tech Stack

- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL with Sequelize ORM.
- **JWT** : Token-based authentication for secure user login and API protection.
- **Redis**: In-memory data structure store, used for storing JWT tokens and session management.
- **File Storage**: AWS S3 for profile images and uploads.
- **Testing**: Postman for API testing.
- **Jest**: Testing framework to write and run unit and integration tests.
- **Notifications**: Nodemailer for sending notifications to users regarding group activities and settlements.
- **Swagger**: API documentation tool for automatically generating interactive API docs.
- **Docker**: Containerization tool to create a consistent development and production environment.

---

## Project Setup

### Prerequisites

1. **Node.js**: Install Node.js.
2. **PostgreSQL**: Set up a PostgreSQL database.
3. **Redis**: Install and configure Redis.
4. **AWS S3**: Set up an S3 bucket for file storage.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/harshitgkm/splitwise-clone
   cd splitwise-clone
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a .env file in the root directory and add:

```bash
PORT=3000
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_postgres_connection_string
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name
```

4. Start the server:

```bash
npm start
```

## Testing

- Use Postman for testing APIs.
- Pass JWT tokens for protected routes.
- Validate responses for all implemented functionalities.

## Future Enhancements

- Currency conversion for international users.
- Simplify debt among users.
