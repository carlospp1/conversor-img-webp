import { useRef } from "react";
import { SingleConversion } from "./pages/SingleConversion";
import { MultipleConversion } from "./pages/MultipleConversion";
import { QualityControl } from "./components/QualityControl";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageConverterProvider,
  useImageConverterContext,
} from "./context/ImageConverterContext";
import "./index.css";

function AppContent() {
  const appRef = useRef(null);

  const {
    activeTab,
    setActiveTab,
    dragActive,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    file,
    files,
    handleConvertIndividual,
    handleConvertMultiple,
  } = useImageConverterContext();

  return (
    <div
      ref={appRef}
      className={`app ${dragActive ? "drag-active" : ""}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {dragActive && (
          <motion.div
            className="global-drop-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            Suelta para añadir imágenes
          </motion.div>
        )}
      </AnimatePresence>

      <div className="background">
        <div className="bubbles"></div>
        <div className="wave"></div>
      </div>

      <QualityControl mode={activeTab} />

      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img src="/favicon.svg" alt="Logo" />
            <span>WebP Converter</span>
          </div>

          <nav className="main-nav">
            <div className="nav-container">
              <motion.div
                className="active-indicator"
                layoutId="activeIndicator"
                initial={false}
                animate={{
                  x: activeTab === "single" ? "0%" : "100%",
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
              <div
                className={`nav-item ${activeTab === "single" ? "active" : ""}`}
                onClick={() => setActiveTab("single")}
              >
                Conversión Individual
              </div>
              <div
                className={`nav-item ${activeTab === "multiple" ? "active" : ""}`}
                onClick={() => setActiveTab("multiple")}
              >
                Conversión Múltiple
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="content-container">
          <AnimatePresence mode="wait">
            {activeTab === "single" ? (
              <motion.div
                key="single"
                className="tab-content"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <SingleConversion />
              </motion.div>
            ) : (
              <motion.div
                key="multiple"
                className="tab-content"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <MultipleConversion />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ImageConverterProvider>
      <AppContent />
    </ImageConverterProvider>
  );
}

export default App;
