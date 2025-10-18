const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withNetworkSecurity(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    
    // Add networkSecurityConfig to application
    const application = androidManifest.manifest.application[0];
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    
    // Create network security config XML
    const projectRoot = config.modRequest.projectRoot;
    const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
    
    if (!fs.existsSync(xmlDir)) {
      fs.mkdirSync(xmlDir, { recursive: true });
    }
    
    const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>`;
    
    fs.writeFileSync(
      path.join(xmlDir, 'network_security_config.xml'),
      xmlContent
    );
    
    return config;
  });
};