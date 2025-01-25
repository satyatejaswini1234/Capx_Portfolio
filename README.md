# Capx_Portfolio

Capx_Portfolio is a portfolio management application where users can sign up, sign in, and manage their stock portfolio. It includes features like user dashboards, graphical representations of portfolio performance, and options to add, edit, or delete stocks from the database.

## Features

- **Authentication**: Users can sign up and sign in securely.
- **Dashboard**: Each logged-in user gets a personalized dashboard displaying:
  - Graphs representing portfolio performance.
  - A "Top Performer" section highlighting the best-performing stocks.
- **Portfolio Management**:
  - Add new stocks to the portfolio by providing the stock symbol, prices, and shares.
  - Edit or delete existing stock entries.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js
- npm (Node Package Manager)

## Installation

To set up the project locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone 
   ```

2. **Navigate to the project directory:**
   ```bash
   cd Capx_Portfolio
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run the project:**
   ```bash
   npm run dev
   ```

## Usage

1. Start the development server by running `npm run dev`.
2. Open your browser and navigate to `http://localhost:3000` (or the port specified in your terminal).
3. Create an account or log in with your credentials.
4. Once logged in, explore the dashboard, view graphs, and manage your portfolio:
   - Use the "Manage Portfolio" button to add new stocks.
   - Edit or delete stocks as needed.

## Folder Structure

The project follows a standard React application structure:

- **src/**: Contains the source code.
  - **components/**: Reusable UI components.
  - **Contexts/**: After Authentications , Adding Stcks,Updating Stocks , Deleting Stocks to get message  .
  - **Supabase/**: database related sql files.
  - **lib/**: Executable main files.

## Tech Stack

- **Frontend**: React.js
- **State Management**: Context API or Redux (if applicable)
- **Backend**: Supabase (for database and authentication)
- **Database**: Supabase (PostgreSQL-powered backend)
- **Charting**: Libraries like Chart.js or Recharts for graphical data representation

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

## Contact

For questions or feedback, feel free to reach out at patnalasatyatejaswini@gmail.com.

