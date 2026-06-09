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
      
      let changed = false;
      content = content.replace(/(from\s+|import\s+)(['"])(\.\/[^'"\.]+|\.\.\/[^'"\.]+)\.js['"]/g, (match, p1, p2, p3) => {
        changed = true;
        return `${p1}${p2}${p3}.js${p2}`;
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
