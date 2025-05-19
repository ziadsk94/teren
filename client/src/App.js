// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import GameDetails from "./pages/GameDetails";
import CreateGame from "./pages/CreateGame";
import VenueManagement from "./pages/VenueManagement";
import VenueBooking from "./pages/VenueBooking";
import VenueStats from "./pages/VenueStats";
import Venues from "./pages/Venues";
import Games from "./pages/Games";
import Profile from "./pages/Profile";
import EditGame from "./pages/EditGame";
import Footer from "./components/Footer";
import "./index.css";

const App = () => {
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  return (
    <I18nextProvider i18n={i18n}>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/:id" element={<GameDetails />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/games/create" element={<CreateGame />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/venues/manage" element={<VenueManagement />} />
              <Route path="/venues/:id/book" element={<VenueBooking />} />
              <Route path="/venues/:id/stats" element={<VenueStats />} />
              <Route path="/games/:id/edit" element={<EditGame />} />
            </Routes>
            <Footer />
          </main>
        </div>
      </Router>
    </I18nextProvider>
  );
};

export default App;
