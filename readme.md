# Operation Tracker

## Overview
Operation Tracker is a web application that allows users to measure the duration of various operations across multiple projects. It features a user-friendly GUI built with React and a REST API powered by Node.js and Express. Users can visualize metrics in a dashboard and manage projects effectively.

## Features
- User authentication with JWT (login/register)
- Create and manage projects
- Generate API keys for projects
- Send metrics via a REST API
- Visualize metrics using charts
- Swagger documentation for API endpoints

## Technologies Used
- **Frontend**: React, Vite, Tailwind CSS, Chart.js
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB
- **API Documentation**: Swagger

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Docker and Docker Compose (for containerized setup)
- MongoDB instance (local or remote)

### Environment Variables
Create a `.env` file in the root directory with the following content:
```
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
API_RATE_LIMIT=100
```

### Running the Application
1. **Clone the repository**:
    ```sh
    git clone https://github.com/yourusername/operation-tracker.git
    cd operation-tracker
    ```

2. **Install dependencies**:
    ```sh
    npm install
    ```

3. **Start the application**:
    ```sh
    npm start
    ```

4. **Run with Docker**:
    ```sh
    docker-compose up --build
    ```

### API Documentation
Access the Swagger documentation at `http://localhost:3000/api-docs` to explore the available endpoints.

### Contributing
1. Fork the repository
2. Create a new branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature-branch`)
5. Open a pull request

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Contact
For any inquiries, please contact [arancibiajav@gmail.com](mailto:arancibiajav@gmail.com).
