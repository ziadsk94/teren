// src/components/Header.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "../assets/logo.png";

const Header = ({ isManagement }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleMenu = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "ro" ? "en" : "ro";
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <img src={logo} alt="Logo" />
        </Link>

        {/* Mobile menu button - always show hamburger */}
        <button
          className="mobile-menu-button"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>

        {/* Navigation */}
        <nav className={`header-nav ${isMenuOpen ? "open" : ""}`}>
          {isMenuOpen && (
            <button
              className="mobile-menu-close"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 28,
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              <X size={28} />
            </button>
          )}
          <Link to="/" className="nav-link">
            {t("home")}
          </Link>
          <Link to="/games" onClick={() => setIsMenuOpen(false)}>
            {t("games")}
          </Link>
          <Link
            to={user?.admin ? "/venues/manage" : "/venues"}
            onClick={() => setIsMenuOpen(false)}
          >
            {t("venues")}
          </Link>
          <Link to="/games/create" onClick={() => setIsMenuOpen(false)}>
            {t("create")}
          </Link>
          {isManagement ? (
            <Link to="/management" onClick={() => setIsMenuOpen(false)}>
              {t("management")}
            </Link>
          ) : token ? (
            <>
              <Link
                to="/profile"
                className="profile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <User size={20} />
                {user && <span>{user.name}</span>}
              </Link>
              <button
                className="ui-btn secondary"
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="ui-btn secondary"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("auth.login")}
              </Link>
              <Link
                to="/signup"
                className="ui-btn primary"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("auth.signup")}
              </Link>
            </>
          )}
          <button
            className="language-switch"
            onClick={toggleLanguage}
            aria-label="Switch language"
          >
            {i18n.language === "ro" ? "EN" : "RO"}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
