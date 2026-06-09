import fs from "fs";
import path from "path";

function processDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith(".ts")) {
      let content = fs.readFileSync(fullPath, "utf-8");
      
      // Regex to match relative imports (starting with ./ or ../) that don't have an extension
      // It handles import and export statements
      const importRegex = /(from\s+['"]|import\s+['"])(\.\/[^'"\.]+|\.\.\/[^'"\.]+)['"]/g;
      
      let changed = false;
      content = content.replace(importRegex, (match, p1, p2) => {
        changed = true;
        return `${p1}${p2}.js"`;
      });
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory("./server");
processDirectory("./api");
