var H = require("hogan.js");
module.exports = function() { var T = new H.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"SubnetPanel\">");t.b("\n");t.b("\n" + i);t.b("  <div class=\"Subnet-overlay\">");t.b("\n" + i);t.b("    <div class='insight-loader'>foo</div>");t.b("\n" + i);t.b("  </div>");t.b("\n");t.b("\n" + i);t.b("  <div class=\"Subnet-content\">");t.b("\n" + i);t.b("    <div class=\"Subnet-header\">");t.b("\n" + i);if(t.s(t.f("subnet",c,p,1),c,p,0,190,492,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("        <div class=\"Subnet-logo\">");t.b("\n" + i);t.b("          <img src=\"");t.b(t.v(t.f("logo",c,p,0)));t.b("\" />");t.b("\n" + i);t.b("        </div>");t.b("\n" + i);t.b("        <div class=\"Subnet-name\">");t.b("\n" + i);t.b("          <div class=\"Subnet-fullname\">");t.b("\n" + i);t.b("            ");t.b(t.v(t.f("name",c,p,0)));t.b("\n" + i);t.b("          </div>");t.b("\n" + i);t.b("          <div class=\"Subnet-id\">");t.b("\n" + i);t.b("            Project ID: ");t.b(t.v(t.f("fileId",c,p,0)));t.b("\n" + i);t.b("          </div>");t.b("\n" + i);t.b("        </div>");t.b("\n" + i);});c.pop();}t.b("    </div>");t.b("\n");t.b("\n" + i);if(t.s(t.f("branches",c,p,1),c,p,0,533,2603,"{{ }}")){t.rs(c,p,function(c,p,t){if(t.s(t.f("active",c,p,1),c,p,0,551,1553,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("        <div class='Subnet-activeBranch block' data-name=\"");t.b(t.v(t.f("name",c,p,0)));t.b("\">");t.b("\n" + i);t.b("          <h2 class='block'>Open Version</h2>");t.b("\n");t.b("\n" + i);t.b("          <div class=\"Subnet-activeName text-success\">");t.b(t.v(t.f("prettyName",c,p,0)));t.b("</div>");t.b("\n");t.b("\n" + i);if(t.s(t.f("isMaster",c,p,1),c,p,0,767,1025,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("            <div class=\"Subnet-masterMessage\">");t.b("\n" + i);t.b("              <p>You are currently viewing the live version.</p>");t.b("\n" + i);t.b("              <p>To make changes, first create a new version, or select an existing one from the versions list.</p>");t.b("\n" + i);t.b("            </div>");t.b("\n" + i);});c.pop();}t.b("\n" + i);t.b("          <div class=\"block\">");t.b("\n" + i);if(t.s(t.f("isWip",c,p,1),c,p,0,1092,1196,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("              <button class='inline-block btn btn-primary Subnet-preview'>Preview</button>");t.b("\n" + i);});c.pop();}if(t.s(t.f("canUpdate",c,p,1),c,p,0,1233,1321,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("              <button class='inline-block btn Subnet-update'>Sync</button>");t.b("\n" + i);});c.pop();}if(t.s(t.f("isWip",c,p,1),c,p,0,1358,1450,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("              <button class='inline-block btn Subnet-publish'>Publish</button>");t.b("\n" + i);});c.pop();}t.b("          </div>");t.b("\n");t.b("\n" + i);t.b("          <progress class='inline-block'></progress>");t.b("\n" + i);t.b("        </div>");t.b("\n" + i);});c.pop();}t.b("\n" + i);t.b("      <div class=\"Subnet-newBranch\">");t.b("\n" + i);t.b("        <h2 class='block'>New Version</h2>");t.b("\n");t.b("\n" + i);t.b("        <input class='input-text native-key-bindings Subnet-newBranchName' type='text' placeholder='New Version Name'>");t.b("\n");t.b("\n" + i);t.b("        <div class=\"block\">");t.b("\n" + i);t.b("          <button class='inline-block btn Subnet-newBranchCreate'>Create Version</button>");t.b("\n" + i);t.b("        </div>");t.b("\n");t.b("\n" + i);t.b("        <progress class='inline-block'></progress>");t.b("\n" + i);t.b("      </div>");t.b("\n");t.b("\n" + i);t.b("      <div class=\"Subnet-branches\">");t.b("\n" + i);t.b("        <h2 class='block'>Versions</h2>");t.b("\n");t.b("\n" + i);if(t.s(t.f("open",c,p,1),c,p,0,2060,2091,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(t.rp("<branch0",c,p,"          "));});c.pop();}t.b("      </div>");t.b("\n");t.b("\n" + i);if(t.s(t.f("hasPublishedVersions",c,p,1),c,p,0,2146,2333,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("        <div class=\"Subnet-branches\">");t.b("\n" + i);t.b("          <h2 class='block'>Published Versions</h2>");t.b("\n");t.b("\n" + i);if(t.s(t.f("published",c,p,1),c,p,0,2262,2297,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(t.rp("<branch1",c,p,"            "));});c.pop();}t.b("        </div>");t.b("\n" + i);});c.pop();}t.b("\n" + i);if(t.s(t.f("hasArchivedVersions",c,p,1),c,p,0,2390,2574,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("        <div class=\"Subnet-branches\">");t.b("\n" + i);t.b("          <h2 class='block'>Archived Versions</h2>");t.b("\n");t.b("\n" + i);if(t.s(t.f("archived",c,p,1),c,p,0,2504,2539,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(t.rp("<branch2",c,p,"            "));});c.pop();}t.b("        </div>");t.b("\n" + i);});c.pop();}});c.pop();}t.b("  </div>");t.b("\n" + i);t.b("</div>");t.b("\n");return t.fl(); },partials: {"<branch0":{name:"branch", partials: {}, subs: {  }},"<branch1":{name:"branch", partials: {}, subs: {  }},"<branch2":{name:"branch", partials: {}, subs: {  }}}, subs: {  }});return T; }();