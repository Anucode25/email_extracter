


## Run Locally

**Prerequisites:**  Node.js

Once you have the files on your computer, follow these steps:
Install Node.js: If you don't have it, download and install it from nodejs.org.
Open Terminal: Open your terminal (or Command Prompt) and navigate to the project folder:
code
Bash
cd path/to/your/project
Install Dependencies: Run the following command to install all the necessary libraries (Express, React, Axios, Cheerio, etc.):
   npm install
Environment Variables:
Create a file named .env in the root directory.
Copy the contents from .env.example into it.
3. Run the Application
Start the development server by running:
      npm run dev
The application will be available at http://localhost:3000 in your web browser.


Note on Architecture
As a reminder, this project is built using Node.js (Express) for the backend and React for the frontend. This setup is required to handle the web crawling logic efficiently and bypass browser security restrictions (CORS) that would otherwise block a pure frontend app from scraping other websites.
