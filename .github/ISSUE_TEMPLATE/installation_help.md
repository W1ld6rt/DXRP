---
name: Installation Help
about: Get help with installing or setting up DXPR
title: '[INSTALL] '
labels: 'help wanted,installation'
assignees: 'ccere'

---

## 🚀 DXPR Installation Help

### Describe your installation issue
<!-- A clear and concise description of what's not working during installation. -->

### What you're trying to do
<!-- Describe what you're trying to accomplish. -->

- [ ] Install DXPR from source code
- [ ] Run DXPR for the first time
- [ ] Set up development environment
- [ ] Install dependencies
- [ ] Build Electron application
- [ ] Create executable with PyInstaller
- [ ] Deploy to production server
- [ ] Other (describe)

### Environment Information

**Operating System:**
- [ ] Windows 10/11
- [ ] macOS
- [ ] Linux (specify distribution)
- [ ] Other (specify)

**OS Version:** [e.g., Windows 10 21H2, macOS 12.6, Ubuntu 22.04]

**Python Version:**
- [ ] Python 3.7
- [ ] Python 3.8
- [ ] Python 3.9
- [ ] Python 3.10
- [ ] Python 3.11
- [ ] Python 3.12
- [ ] Other (specify version)

**Node.js Version:**
- [ ] Node.js 16.x
- [ ] Node.js 18.x
- [ ] Node.js 20.x
- [ ] Node.js 21.x
- [ ] Other (specify version)

**Package Manager:**
- [ ] pip (Python)
- [ ] conda (Python)
- [ ] npm (Node.js)
- [ ] yarn (Node.js)
- [ ] Other (specify)

### Installation Method
<!-- How are you trying to install DXPR? -->

- [ ] Git clone + manual setup
- [ ] Downloaded release package
- [ ] Using package manager
- [ ] Docker container
- [ ] Other (describe)

### Current Status
<!-- What step are you currently on? -->

- [ ] Cloned/downloaded source code
- [ ] Installing Python dependencies
- [ ] Installing Node.js dependencies
- [ ] Running Python application
- [ ] Building Electron application
- [ ] Testing functionality
- [ ] Other (describe)

### Error Messages
<!-- Any error messages you see during installation. -->

**Python Errors:**
```
Paste any Python error messages here
```

**Node.js/npm Errors:**
```
Paste any npm/yarn error messages here
```

**System Errors:**
```
Paste any system-level error messages here
```

**Browser Errors:**
```
Paste any browser console errors here
```

### Steps you've already tried
<!-- List installation steps you've already attempted. -->

- [ ] Cloned the repository
- [ ] Installed Python requirements
- [ ] Installed Node.js dependencies
- [ ] Started the Python server
- [ ] Opened the web interface
- [ ] Tested OBS integration
- [ ] Other (describe)

### Screenshots
<!-- If applicable, add screenshots of error messages or installation steps. -->

### Expected behavior
<!-- What should happen when installation is successful? -->

### Additional context
<!-- Any other information that might be relevant. -->

## 🔧 Installation Checklist

### Prerequisites
- [ ] Python 3.7+ installed and in PATH
- [ ] Node.js 16+ installed and in PATH
- [ ] Git installed (for source installation)
- [ ] pip/conda available
- [ ] npm/yarn available
- [ ] Sufficient disk space (at least 500MB)
- [ ] Internet connection for dependencies

### Python Setup
- [ ] Python executable accessible from command line
- [ ] pip package manager working
- [ ] Virtual environment created (recommended)
- [ ] Dependencies installed successfully
- [ ] No import errors

### Node.js Setup
- [ ] Node.js executable accessible from command line
- [ ] npm/yarn package manager working
- [ ] Dependencies installed successfully
- [ ] No build errors

### Application Startup
- [ ] Python server starts without errors
- [ ] Web interface accessible in browser
- [ ] No JavaScript errors in console
- [ ] Components load correctly

## 📚 Installation Guide

**Quick Start:**
1. Clone repository: `git clone https://github.com/username/dxpr.git`
2. Install Python dependencies: `pip install -r requirements.txt`
3. Install Node.js dependencies: `npm install`
4. Start application: `python start.py`
5. Open browser: `http://localhost:5000`

**Detailed Steps:**
- [Installation Guide](README.md#installation)
- [Development Setup](README.md#development)
- [Troubleshooting](README.md#troubleshooting)

## 🆘 Common Issues

**Python Issues:**
- **Module not found**: Check Python version and virtual environment
- **Permission denied**: Use virtual environment or check user permissions
- **SSL errors**: Update pip or check network settings

**Node.js Issues:**
- **npm install fails**: Clear npm cache or check Node.js version
- **Build errors**: Check Python and build tools installation
- **Permission errors**: Use `npm install --unsafe-perm` or fix permissions

**System Issues:**
- **PATH not found**: Add Python/Node.js to system PATH
- **Port already in use**: Change port in configuration
- **Firewall blocking**: Allow application through firewall

## 🆘 Still Need Help?

If the issue persists after trying these steps:

1. **Check existing issues** for similar problems
2. **Review installation logs** for specific errors
3. **Try minimal setup** (basic Python + Flask)
4. **Test with different versions** of Python/Node.js
5. **Provide complete error logs** and system information

---

**Thank you for helping improve DXPR's installation process!** 🚀✨
