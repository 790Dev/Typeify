import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AuthModal from "./Auth/AuthModal";
import { FaKeyboard, FaTrophy, FaUser } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";
import { FiSun, FiMoon } from "react-icons/fi";

const NavItem = ({ icon, label, active, onClick, to }) => {
  const content = (
    <>
      {icon}
      <span
        className={`pointer-events-none absolute -bottom-1 h-[3px] rounded-full bg-accent transition-all duration-300
          ${active ? "w-5 opacity-100" : "w-0 opacity-0"}`}
      />
    </>
  );

  const className = `group relative grid h-10 w-10 place-items-center rounded-lg text-xl transition-all duration-200
      ${active ? "text-accent bg-accent/10" : "text-sub-alt hover:text-text hover:bg-surface-2"}`;

  if (to) {
    return (
      <Link to={to} title={label} aria-label={label} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} title={label} aria-label={label} className={className}>
      {content}
    </button>
  );
};

const NavBar = () => {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const { isLightMode, toggleTheme } = useTheme();
  const location = useLocation();
  const currentPage = location.pathname;

  return (
    <>
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8 sm:py-6">
        <Link
          to="/"
          className="group flex items-center gap-3"
          onClick={(e) => {
            if (currentPage === "/") {
              e.preventDefault();
              window.dispatchEvent(new Event("reset-typing-test"));
            }
          }}
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-2xl text-accent transition-transform duration-200 group-hover:-rotate-6">
            <FaKeyboard />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-text">type</span>
            <span className="text-accent">ify</span>
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          <NavItem
            icon={isLightMode ? <FiMoon /> : <FiSun />}
            label="Toggle Theme"
            active={false}
            onClick={toggleTheme}
          />
          <NavItem
            icon={<FaTrophy />}
            label="Leaderboard"
            active={currentPage === "/leaderboard"}
            to="/leaderboard"
          />

          <NavItem
            icon={<GiCrossedSwords />}
            label={isAuthenticated ? "Multiplayer" : "Multiplayer (login required)"}
            active={currentPage === "/multiplayer"}
            to={isAuthenticated ? "/multiplayer" : undefined}
            onClick={(e) => {
              if (!isAuthenticated) {
                e?.preventDefault();
                setShowAuthModal(true);
              }
            }}
          />

          {isAuthenticated ? (
            <NavItem
              icon={<FaUser />}
              label="Profile"
              active={currentPage === "/profile"}
              to="/profile"
            />
          ) : (
            <NavItem
              icon={<FaUser />}
              label="Login"
              active={false}
              onClick={() => setShowAuthModal(true)}
            />
          )}
        </div>
      </nav>
      <AuthModal />
    </>
  );
};

export default NavBar;
