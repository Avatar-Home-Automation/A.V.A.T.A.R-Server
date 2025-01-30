# Changelog - Version 5.2.0

## 📅 Release Date
24 january 2025

---

## 🚀 New Features and Improvements

### ✨ New Features
- **[Interface ]**: New Interface with Xel-toolkit
- **[Voice Rule]**: Call a voice rule directly without necessarily triggering listening through the keyword. Note that this feature requires updating the clients to version 3.2.0 and configuring these direct-call rules on each client.  
- **[Plugin Audit]**: New `Audit` command accessible from `Plugin Studio`. This command verifies the integrity of all plugins with `npm` packages. It generates a report on security vulnerabilities and outdated versions of the packages requiring updates. The command also provides an option to update these packages when possible.  
- **[Information]**: New `Information` command accessible from the application menu. This command checks the integrity of A.V.A.T.A.R.'s `npm` packages. It generates a report on security vulnerabilities and outdated versions of the packages requiring updates.  
- **[Plugin Library]**: Installing a plugin from the `Plugin Library` now automatically installs the plugin's packages to their latest versions. There is no need to have a _node_modules_ directory saved in the plugin's GitHub project. Only the _package.json_ file containing the required packages is necessary.  
- **[Version Log]**: The update process now displays a summary log of the new application version's changes.  

---

## 🐞 Bug Fixes
- Fixed PowerShell scripts for installation and updates:  
  - Added a check to ensure that `npm` is installed.  
  - Added a test for the PowerShell version used (>= 7.0).  
  - Fixed the call to `npm` by using `npm.cmd` on Windows to avoid invoking an `npm.ps1`.  
  - Fixed the creation of the A.V.A.T.A.R Server shortcut for Windows 11.
- Bug displaying plugin images in the `Plugin Library` has been fixed.
- Fixed minor visual bugs.  
- Corrected application messages.

---

## ⚠️ Breaking Changes
- If you have plugins with `npm` packages, you can update them by removing the _node_modules_ directory and, if necessary, adding a _package.json_ file in the plugin's GitHub project.  


---

## 📚 Updated Documentation
- Refer to the [documentation](https://avatar-home-automation.github.io/docs/) for more information about the new features.  


---

## 📩 Feedback and Support
If you encounter issues or have questions, open an [issue](https://github.com/Avatar-Home-Automation/A.V.A.T.A.R-Server/issues) or contact us at [avatar.home.automation@gmail.com]

---

💣 This Changelog will self-destruct upon the next update installation. In the meantime, you can view it in the `information` command and by clicking on the `Change log` link.

<br><br>
