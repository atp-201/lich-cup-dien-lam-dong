import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function scrapeProvince(filterKeyword: string = "") {
  const targetUrl = `https://lichcupdien.org/lich-cup-dien-lam-dong`;
  console.log(`Scraping power outage schedules from ${targetUrl}...`);
  try {
    const response = await axios.get(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });
    const html = response.data;
    const $ = cheerio.load(html);
    
    const text = $("body").text().replace(/\s+/g, " ");
    const regex = /Điện lực:\s*(.*?)\s*Ngày:\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})\s*Thời gian:\s*Từ\s*(\d{2}:\d{2})\s*đến\s*(\d{2}:\d{2})\s*Khu vực:\s*(.*?)\s*Lý do:\s*(.*?)\s*Trạng thái:/g;
    
    let match;
    let parsedData = [];

    while ((match = regex.exec(text)) !== null) {
      const district = match[1].trim();
      const day = match[2].padStart(2, '0');
      const month = match[3].padStart(2, '0');
      const year = match[4];
      const area = match[7].trim();
      
      const keywordLower = filterKeyword ? filterKeyword.toLowerCase() : "";
      if (!keywordLower || area.toLowerCase().includes(keywordLower) || district.toLowerCase().includes(keywordLower)) {
          
          let startIso = "";
          let endIso = "";
          try {
            startIso = new Date(`${year}-${month}-${day}T${match[5]}:00+07:00`).toISOString();
            endIso = new Date(`${year}-${month}-${day}T${match[6]}:00+07:00`).toISOString();
          } catch (e) {
            continue;
          }

          if (startIso && endIso) {
            const idStr = `${district}-${area}-${startIso}`;
            const id = crypto.createHash("sha256").update(idStr).digest("hex");
            parsedData.push({
               id: id,
               district: district,
               area: area,
               start_time: startIso,
               end_time: endIso,
               reason: match[8].trim()
            });
          }
      }
    }
    
    return parsedData;
  } catch (error) {
    console.error("Error scraping schedules:", error);
    return [];
  }
}

async function run() {
  const data = await scrapeProvince("");
  const outputPath = path.join(process.cwd(), "public", "schedules.json");
  
  if (!fs.existsSync(path.join(process.cwd(), "public"))) {
     fs.mkdirSync(path.join(process.cwd(), "public"));
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Saved ${data.length} records to public/schedules.json`);
}

run();
