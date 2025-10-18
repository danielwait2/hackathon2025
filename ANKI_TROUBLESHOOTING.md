# AnkiConnect Troubleshooting Guide

## ✅ **AnkiConnect is Working!**

Your AnkiConnect is properly installed and running. The connection test shows:

- ✅ AnkiConnect is responding on port 8765
- ✅ Version 6 is supported
- ✅ Basic requests work correctly

## 🔧 **Common Issues & Solutions**

### **Issue 1: Socket Hang Up Errors**

**Cause**: Large requests or connection timeouts
**Solution**:

1. Make sure Anki is fully loaded and not busy
2. Try pushing fewer flashcards at once
3. Restart Anki if needed

### **Issue 2: Connection Reset Errors**

**Cause**: AnkiConnect gets overwhelmed with large requests
**Solution**:

1. Close and reopen Anki
2. Make sure no other applications are using AnkiConnect
3. Try the push operation again

### **Issue 3: Timeout Errors**

**Cause**: Anki is processing other operations
**Solution**:

1. Wait for Anki to finish any current operations
2. Close any open Anki windows except the main window
3. Try again in a few seconds

## 🚀 **Best Practices**

1. **Keep Anki Open**: Always keep Anki running when using the flashcard generator
2. **Automatic Batching**: The system now automatically handles large batches:
   - **≤5 cards**: Single bulk push (fastest)
   - **>5 cards**: Automatic batch processing (3 cards per batch)
   - **Individual fallback**: If batches fail, pushes one at a time
3. **Wait Between Operations**: Give Anki time to process each request
4. **Check Anki Status**: Make sure Anki isn't busy with other operations

## 🛠️ **Quick Fixes**

### **If Push Fails:**

1. Check that Anki is running and responsive
2. Try pushing 1-2 flashcards first
3. If successful, try larger batches
4. Restart Anki if problems persist

### **If Connection Fails:**

1. Restart Anki completely
2. Check that AnkiConnect add-on is enabled
3. Try the connection test again

## 📝 **Testing Your Setup**

Run this command to test your AnkiConnect:

```bash
curl -X POST http://localhost:8765 -H "Content-Type: application/json" -d '{"action": "version", "version": 6}'
```

You should see: `{"result": 6, "error": null}`

## 🎯 **Ready to Use!**

Your setup is working correctly. The occasional connection issues are normal and can be resolved by:

- Keeping Anki open and responsive
- Pushing flashcards in reasonable batches
- Retrying if a request fails

The flashcard generator will work perfectly with these guidelines!
