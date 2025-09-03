---
name: Performance Optimization Request
about: Request performance improvements or report performance issues
title: '[PERF] '
labels: 'performance, enhancement, help wanted'
assignees: 'ccere'

---

## ⚡ Performance Optimization Request

### What performance issue are you experiencing?

**Type of Performance Issue:**
- [ ] Slow application startup
- [ ] Slow page loading
- [ ] Slow Bible navigation
- [ ] Slow song switching
- [ ] Slow OBS scene switching
- [ ] High memory usage
- [ ] High CPU usage
- [ ] Slow network requests
- [ ] UI lag or stuttering
- [ ] Other (describe)

**Severity:**
- [ ] Critical (unusable)
- [ ] High (major impact on workflow)
- [ ] Medium (noticeable impact)
- [ ] Low (minor inconvenience)

### What are you trying to do?

<!-- Describe the task or action that's slow -->

### What is the expected performance?

<!-- Describe what performance you expected -->

### What is the actual performance?

<!-- Describe what performance you're actually getting -->

### Performance metrics

**Response Times:**
- Application startup: [e.g., 2 seconds, 10+ seconds]
- Page load: [e.g., 1 second, 5+ seconds]
- Bible navigation: [e.g., instant, 1-2 seconds, 5+ seconds]
- Song switching: [e.g., instant, 1-2 seconds, 5+ seconds]
- OBS scene switching: [e.g., instant, 1-2 seconds, 5+ seconds]

**Resource Usage:**
- CPU usage: [e.g., 10%, 50%, 90%+]
- Memory usage: [e.g., 100MB, 500MB, 1GB+]
- Network activity: [e.g., low, moderate, high]
- Disk I/O: [e.g., low, moderate, high]

**Browser Performance:**
- FPS: [e.g., 60fps, 30fps, <15fps]
- Memory usage: [e.g., 50MB, 200MB, 500MB+]
- CPU usage: [e.g., 5%, 20%, 50%+]

### Environment information

**System Specifications:**
- **OS**: [e.g., Windows 10, macOS 12, Ubuntu 22.04]
- **CPU**: [e.g., Intel i5-8400, AMD Ryzen 5 3600, Apple M1]
- **RAM**: [e.g., 8GB, 16GB, 32GB]
- **Storage**: [e.g., SSD, HDD, NVMe]
- **Graphics**: [e.g., Integrated, GTX 1060, RTX 3080]

**Software Versions:**
- **Python**: [e.g., 3.9.7, 3.10.4, 3.11.0]
- **Node.js**: [e.g., 16.15.0, 18.12.0, 20.0.0]
- **Browser**: [e.g., Chrome 108, Firefox 107, Edge 108]
- **OBS Studio**: [e.g., 28.0.3, 29.0.0]

### When does this happen?

**Frequency:**
- [ ] Always
- [ ] Sometimes
- [ ] Only under specific conditions
- [ ] After using the app for a while

**Specific Actions:**
- [ ] Opening the application
- [ ] Switching between views
- [ ] Navigating Bible verses
- [ ] Loading songs
- [ ] Connecting to OBS
- [ ] Switching OBS scenes
- [ ] Other (describe)

**Data Size:**
- **Bible files**: [e.g., 1MB, 10MB, 50MB+]
- **Song files**: [e.g., 10 songs, 100 songs, 1000+ songs]
- **OBS scenes**: [e.g., 5 scenes, 20 scenes, 50+ scenes]

### Performance comparison

**Before vs After:**
- When did this performance issue start?
- Was it always slow or did it get worse?
- What changed when the problem started?

**Other Applications:**
- How does DXPR performance compare to other similar applications?
- Are other applications also slow on your system?

### What you've already tried

- [ ] Restarted the application
- [ ] Restarted the computer
- [ ] Cleared browser cache
- [ ] Disabled browser extensions
- [ ] Used different browser
- [ ] Closed other applications
- [ ] Checked system resources
- [ ] Updated drivers
- [ ] Scanned for malware

### Additional context

<!-- Add any other context about the performance issue -->

- Are you using a virtual machine?
- Are you behind a corporate firewall/proxy?
- Do you have antivirus software running?
- Are you using multiple monitors?
- Any other relevant system information?

### Screenshots

If applicable, add screenshots to help explain the performance issue:
- Task Manager showing resource usage
- Browser DevTools Performance tab
- DXPR interface showing slow behavior
- Error messages or warnings

## 📋 Checklist

Before submitting, please ensure you have:

- [ ] Provided system specifications
- [ ] Measured actual performance metrics
- [ ] Described when the problem occurs
- [ ] Included browser console errors
- [ ] Specified data sizes and complexity
- [ ] Described your testing environment

## 🆘 Urgency

- [ ] This is blocking my live stream/production
- [ ] I can work around it but it's annoying
- [ ] This is just for testing/development

## 🔧 Quick performance tips

**Common Performance Issues:**

1. **Large Bible files**: Consider using smaller Bible files or optimizing XML parsing
2. **Many song files**: Limit the number of songs loaded at once
3. **Browser extensions**: Disable unnecessary browser extensions
4. **System resources**: Close other applications to free up resources
5. **Network latency**: Check if network issues are affecting performance

**Performance Testing:**

1. **Browser DevTools**: Use Performance tab to identify bottlenecks
2. **System Monitor**: Check CPU, memory, and disk usage
3. **Network Tab**: Monitor network requests and response times
4. **Console Logs**: Look for performance warnings or errors

## 🚀 Optimization Opportunities

**Areas for Improvement:**

1. **Frontend**: JavaScript optimization, CSS optimization, image optimization
2. **Backend**: Database queries, caching, API response times
3. **Network**: Request batching, compression, CDN usage
4. **System**: Resource management, memory leaks, CPU optimization

**Your Contribution:**

- [ ] I can help test optimizations
- [ ] I can provide performance data
- [ ] I can help implement fixes
- [ ] I just need the issue fixed

---

**Let's optimize your DXPR performance!** ⚡🚀
