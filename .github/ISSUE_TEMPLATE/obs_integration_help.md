---
name: OBS Integration Help
about: Get help with OBS Studio integration issues
title: '[OBS HELP] '
labels: 'help wanted,obs-integration'
assignees: 'ccere'

---

## 🎥 OBS Studio Integration Help

### Describe your OBS integration issue
<!-- A clear and concise description of what's not working with OBS Studio. -->

### OBS Studio Setup
Please provide the following information:

**OBS Studio Version:**
- [ ] OBS Studio 28.x
- [ ] OBS Studio 29.x
- [ ] OBS Studio 30.x
- [ ] Other (specify version)

**OBS WebSocket Plugin:**
- [ ] OBS WebSocket 5.x (OBS 28+)
- [ ] OBS WebSocket 4.x (OBS 27)
- [ ] Not installed
- [ ] Don't know

**Operating System:**
- [ ] Windows 10/11
- [ ] macOS
- [ ] Linux
- [ ] Other (specify)

### Current Configuration

**OBS WebSocket Settings:**
```
Server Port: [e.g., 4455]
Server Password: [e.g., enabled/disabled]
Enable Authentication: [Yes/No]
```

**DXPR OBS Configuration:**
```json
{
  "host": "localhost",
  "port": 4455,
  "password": "your_password_here"
}
```

### What you're trying to do
<!-- Describe what you're trying to accomplish with OBS integration. -->

- [ ] Connect DXPR to OBS Studio
- [ ] Project Bible verses
- [ ] Project song lyrics
- [ ] Show lower third overlays
- [ ] Switch OBS scenes
- [ ] Start/stop streaming
- [ ] Other (describe)

### What happens when you try
<!-- Describe the behavior you're experiencing. -->

### Error messages
<!-- Any error messages you see in DXPR or OBS Studio. -->

**DXPR Console Errors:**
```
Paste any browser console errors here
```

**OBS Studio Logs:**
```
Paste any OBS Studio log entries here
```

**Python/Server Errors:**
```
Paste any server-side error logs here
```

### Steps you've already tried
<!-- List troubleshooting steps you've already attempted. -->

- [ ] Restarted OBS Studio
- [ ] Restarted DXPR
- [ ] Checked OBS WebSocket plugin installation
- [ ] Verified port settings
- [ ] Tested with/without password
- [ ] Checked firewall settings
- [ ] Verified OBS is running
- [ ] Other (describe)

### Screenshots
<!-- If applicable, add screenshots of your OBS WebSocket settings and DXPR configuration. -->

### Expected behavior
<!-- What should happen when everything is working correctly? -->

### Additional context
<!-- Any other information that might be relevant. -->

## 🔧 Troubleshooting Checklist

### Basic OBS Setup
- [ ] OBS Studio is running
- [ ] OBS WebSocket plugin is installed and enabled
- [ ] WebSocket server is started
- [ ] Port is not blocked by firewall
- [ ] Authentication settings match DXPR config

### Network Configuration
- [ ] Using localhost/127.0.0.1 for local connections
- [ ] Port is not used by other applications
- [ ] No antivirus blocking the connection
- [ ] Network adapter settings are correct

### DXPR Configuration
- [ ] OBS settings are saved in DXPR
- [ ] Connection test button works
- [ ] No JavaScript errors in browser console
- [ ] Server is running without errors

## 📚 Resources

**Helpful Links:**
- [OBS WebSocket Documentation](https://github.com/obsproject/obs-websocket)
- [DXPR OBS Integration Guide](README.md#obs-integration)
- [OBS Studio Installation](https://obsproject.com/)

**Common Solutions:**
1. **Port conflicts**: Try different ports (4444, 4455, 8080)
2. **Authentication**: Disable password temporarily for testing
3. **Plugin issues**: Reinstall OBS WebSocket plugin
4. **Firewall**: Allow OBS and DXPR through Windows Firewall

## 🆘 Still Need Help?

If the issue persists after trying these steps:

1. **Check existing issues** for similar problems
2. **Join community discussions** for real-time help
3. **Provide detailed logs** from both DXPR and OBS
4. **Test with minimal setup** (new OBS profile)

---

**Thank you for helping improve DXPR's OBS integration!** 🎥✨
