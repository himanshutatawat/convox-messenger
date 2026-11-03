# NextJs Messenger Clone

A fully responsive, real-time chat application showcasing full-stack web development skills using NextJs 13, MongoDB, Tailwind CSS, Pusher, Next-Auth, and Cloudinary.

<p align="center"> 
    <img src="public/images/Screenshot (84).png" alt="App Preview">     
</p>

<p align="center"> 
    <img src="public/images/Screenshot (85).png" alt="App Preview">      
</p>
<p align="center"> 
    <img src="public/images/Screenshot (88).png" alt="App Preview">      
</p>

<p align="center"> 
    <img src="public/images/Screenshot (89).png" alt="App Preview">      
</p>

# App Theme changed to white
<p align="center"> 
    <img src="public/images/Screenshot (90).png" alt="App Preview">      
</p>
# Table of Contents

- [Live Demo](#live-demo)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup and Installation](#setup-and-installation)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup](#database-setup)
  - [Authentication Setup](#authentication-setup)
  - [Image Hosting Setup](#image-hosting-setup)
  - [Real-Time Updates Setup](#real-time-updates-setup)
- [Usage](#usage)
  - [Development](#development)
  - [Production](#production)
- [Commands](#commands)
- [References](#references)



## Features

- **Real-time Chat Updates**: Powered by Pusher for instant messaging.
- **Group Chat**: Create and participate in group conversations.
- **Chat History Deletion**: Remove unwanted messages.
- **Image Upload and Hosting**: Utilizes Cloudinary for image handling.
- **Dynamic Themes**: Switch between light and dark modes.
- **Responsive Design**: Optimized for both desktop and mobile devices.



## Technologies Used

- **[NextJs](https://nextjs.org/)** (13.4.x)
- **[React](https://reactjs.org/)** (18.x)
- **[MongoDB](https://www.mongodb.com/atlas/database)** (6.x)
- **[Tailwind CSS](https://tailwindcss.com/)** (3.x)
- **[Pusher](https://pusher.com/)** (5.x)
- **[Next-Auth](https://next-auth.js.org/)** (4.x)
- **[Typescript](https://www.typescriptlang.org/)** (5.x)

## Setup and Installation

### Prerequisites

Ensure you have the following installed:

- Node.js (14.x or higher)
- Yarn package manager

### Environment Configuration

1. Clone the repository:

    ```sh
    git clone https://github.com/himanshutatawat/Messenger_clone.git
    cd NextJs-Messenger-Clone
    ```

2. Create a `.env.local` file in the root directory and add the following variables:

    ```env
    DATABASE_URL=your_mongodb_connection_string
    NEXTAUTH_URL=http://localhost:3020
    NEXTAUTH_SECRET=your_nextauth_secret
    GITHUB_ID=your_github_client_id
    GITHUB_SECRET=your_github_client_secret
    GOOGLE_ID=your_google_client_id
    GOOGLE_SECRET=your_google_client_secret
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
    PUSHER_APP_ID=your_pusher_app_id
    PUSHER_KEY=your_pusher_key
    PUSHER_SECRET=your_pusher_secret
    PUSHER_CLUSTER=your_pusher_cluster
    ```

### Database Setup

1. Register at [MongoDB Atlas](https://www.mongodb.com/atlas/database) and create a cluster.
2. Create a database user and allow access from any IP (`0.0.0.0/0`).
3. Copy the connection string and replace `<password>` with your database user’s password. Append `?retryWrites=true&w=majority` to the connection string.



### Project Initialization

1. Install the dependencies:

    ```sh
    yarn install
    ```

2. Set up the database:

    ```sh
    yarn prisma db push
    yarn prisma generate
    ```

## Usage

### Development

Start the development server:

```sh
yarn dev
