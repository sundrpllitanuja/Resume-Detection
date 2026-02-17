const { useState, useEffect } = React;

function ResumeShieldDashboard() {
  const [resumes, setResumes] = useState([]);

  // --- STYLES OBJECT ---
  const styles = {
    container: { 
      display: "flex", 
      height: "100vh", 
      backgroundColor: "#0b1120", 
      color: "#ffffff", 
      fontFamily: "Arial, sans-serif" 
    },
    sidebar: { 
      width: "260px", 
      backgroundColor: "#111827", 
      padding: "20px", 
      display: "flex", 
      flexDirection: "column",
      borderRight: "1px solid #1f2937"
    },
    logo: { 
      fontSize: "22px", 
      fontWeight: "bold", 
      marginBottom: "30px", 
      color: "#10b981",
      letterSpacing: "1px"
    },
    sidebarItem: { 
      padding: "12px 14px", 
      borderRadius: "8px", 
      cursor: "pointer", 
      marginBottom: "10px", 
      color: "#9ca3af",
      transition: "background 0.2s"
    },
    profileSection: { 
      marginTop: "auto", 
      paddingTop: "20px", 
      borderTop: "1px solid #1f2937", 
      display: "flex", 
      alignItems: "center", 
      gap: "12px" 
    },
    profileCircle: { 
      width: "40px", 
      height: "40px", 
      borderRadius: "50%", 
      backgroundColor: "#10b981", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      fontWeight: "bold", 
      color: "#0b1120" 
    },
    main: { 
      flex: 1, 
      padding: "40px", 
      backgroundColor: "#0f172a", 
      overflowY: "auto" 
    },
    header: { 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      marginBottom: "40px" 
    },
    button: { 
      backgroundColor: "#10b981", 
      border: "none", 
      padding: "10px 18px", 
      borderRadius: "6px", 
      cursor: "pointer", 
      fontWeight: "bold", 
      color: "#0b1120" 
    },
    card: { 
      backgroundColor: "#111827", 
      padding: "30px", 
      borderRadius: "12px", 
      textAlign: "center", 
      marginBottom: "50px",
      border: "1px solid #1f2937"
    },
    ctaSection: { 
      background: "linear-gradient(135deg, #064e3b, #022c22)", 
      padding: "50px 30px", 
      borderRadius: "16px", 
      textAlign: "center",
      boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
    },
    ctaButton: { 
      marginTop: "20px", 
      backgroundColor: "#10b981", 
      border: "none", 
      padding: "14px 28px", 
      borderRadius: "8px", 
      fontWeight: "bold", 
      cursor: "pointer", 
      fontSize: "16px", 
      color: "#0b1120" 
    },
    resultList: {
      marginTop: '40px',
      backgroundColor: '#111827',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #1f2937'
    },
    resultItem: { 
      padding: '15px', 
      borderBottom: '1px solid #1f2937', 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  };

  // Check authentication on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
    } else {
      loadResumes();
    }
  }, []);

  // Fetch past results from server
  const loadResumes = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/my_resumes", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResumes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  };

  const handleAnalyze = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf";

    fileInput.onchange = async (e) => {
      const selectedFile = e.target.files[0];
      if (!selectedFile) return;

      const formData = new FormData();
      formData.append("resumeFile", selectedFile); // Name must match server's upload.single("resumeFile")

      const token = localStorage.getItem("token");
      try {
        const response = await fetch("/upload_resume", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });

        const result = await response.json();

        if (response.ok) {
          alert("Resume Analyzed Successfully!");
          loadResumes(); // Refresh the list
        } else {
          alert("Upload failed: " + (result.message || "Unknown error"));
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("An error occurred during upload.");
      }
    };
    fileInput.click();
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>RESUME SHIELD</div>
        <div style={styles.sidebarItem}></div>
        <div style={styles.sidebarItem}>Full History</div>
        <div style={styles.sidebarItem}>Settings</div>
        
        <div style={styles.profileSection}>
          <div style={styles.profileCircle}>A</div>
          <div>
            <div style={{fontSize: '14px', fontWeight: 'bold'}}>Admin User</div>
            <div style={{fontSize: '12px', color: '#9ca3af'}}>Authority Access</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <div style={styles.header}>
          <h1>Authority Dashboard</h1>
          <button style={styles.button} onClick={handleLogout}>Logout</button>
        </div>

        <div style={styles.card}>
          <h2>Welcome to Resume Shield</h2>
          <p style={{color: '#9ca3af'}}>Our AI evaluates resumes for fraud indicators and verifies credentials in real-time.</p>
        </div>

        <div style={styles.ctaSection}>
          <h2 style={{margin: 0}}>Ready to Verify?</h2>
          <p style={{color: '#d1d5db', marginBottom: '20px'}}>Upload a candidate's resume in PDF format to start the scan.</p>
          <button style={styles.ctaButton} onClick={handleAnalyze}>
            Upload & Analyze Resume
          </button>
        </div>

        {/* Results List */}
        <div style={styles.resultList}>
          <h3 style={{marginTop: 0, marginBottom: '20px'}}>Recent Analysis Results</h3>
          {resumes.length === 0 ? (
            <p style={{color: '#9ca3af', textAlign: 'center'}}>No resumes scanned yet.</p>
          ) : (
            resumes.map((r, i) => (
              <div key={i} style={styles.resultItem}>
                <div>
                  <div style={{fontWeight: 'bold'}}>{r.fileName}</div>
                  <div style={{fontSize: '12px', color: '#9ca3af'}}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  backgroundColor: r.fraudScore > 70 ? '#450a0a' : '#064e3b',
                  color: r.fraudScore > 70 ? '#f87171' : '#34d399',
                  border: `1px solid ${r.fraudScore > 70 ? '#ef4444' : '#10b981'}`
                }}>
                  Score: {r.fraudScore}%
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Render the App
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ResumeShieldDashboard />);