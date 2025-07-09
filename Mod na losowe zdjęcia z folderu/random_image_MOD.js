const fs = require("fs");
const path = require("path");
const { MessageAttachment, MessageEmbed } = require("discord.js");

module.exports = {
  name: "Losowe Zdjęcie z Folderu",
  section: "Messaging",

  meta: {
    version: "2.1.7",
    preciseCheck: false,
    author: "Liseczkowy",
    authorUrl: null,
    downloadUrl: null,
  },

  fields: ["folderPath", "embedTitle", "embedColor", "footer"],

  html() {
    return `
    <div style="padding: 10px;">
      <span class="dbminputlabel">Folder z obrazkami (np. images)</span><br>
      <input id="folderPath" class="round" type="text" placeholder="images" style="width: 100%;"><br><br>

      <span class="dbminputlabel">Tytuł embeda</span><br>
      <input id="embedTitle" class="round" type="text" placeholder="Losowe zdjęcie" style="width: 100%;"><br><br>

      <span class="dbminputlabel">Kolor embeda (hex)</span><br>
      <input id="embedColor" class="round" type="text" placeholder="#00ffcc" style="width: 100%;"><br><br>

      <span class="dbminputlabel">Footer</span><br>
      <input id="footer" class="round" type="text" placeholder="Napisz coś tutaj..." style="width: 100%;">
    </div>`;
  },

  // Poprawienie metody subtitle, aby naprawić 'undefined'
  subtitle(data) {
    const embedTitle = data.embedTitle || "Losowe zdjęcie";  // Jeśli tytuł jest undefined, przypiszemy domyślny tytuł
    return `Tytuł: ${embedTitle}`;
  },

  init() {},

  async action(cache) {
    const data = cache.actions[cache.index];

    const folderPath = this.evalMessage(data.folderPath, cache) || "images";
    const embedTitle = this.evalMessage(data.embedTitle, cache) || "Losowe zdjęcie";  // Dodajemy domyślny tytuł
    const embedColor = this.evalMessage(data.embedColor, cache) || "#00ffcc";
    const footer = this.evalMessage(data.footer, cache) || "";

    // Ustawienie domyślnego tytułu, jeśli embedTitle jest undefined lub pusty
    const finalEmbedTitle = embedTitle && embedTitle.trim() !== "" ? embedTitle : "Losowe zdjęcie";

    // Upewnij się, że folder istnieje
    const fullFolder = path.join(process.cwd(), folderPath);
    if (!fs.existsSync(fullFolder)) {
      console.error(`❌ Folder nie istnieje: ${fullFolder}`);
      return this.callNextAction(cache);
    }

    const files = fs.readdirSync(fullFolder).filter(file =>
      /\.(jpe?g|png|gif|webp)$/i.test(file)
    );

    if (!files.length) {
      console.error(`❌ Brak obrazów w folderze: ${fullFolder}`);
      return this.callNextAction(cache);
    }

    const randomFile = files[Math.floor(Math.random() * files.length)];
    const filePath = path.join(fullFolder, randomFile);
    const fileNameWithoutExtension = randomFile.replace(/\.[^/.]+$/, "");
    const safeName = randomFile.replace(/[^\w.-]/g, "_");

    const attachment = new MessageAttachment(filePath, safeName);
    const embed = new MessageEmbed()
      .setTitle(finalEmbedTitle) // Używamy finalEmbedTitle, które ma zawsze wartość
      .setColor(embedColor)
      .setImage("attachment://" + safeName)
      .setDescription(fileNameWithoutExtension) // Nazwa pliku bez rozszerzenia jako opis
      .setFooter(footer.trim() || ""); // Footer, jeśli jest podany

    try {
      if (cache.interaction?.deferReply) {
        try {
          await cache.interaction.deferReply();
        } catch (e) {}
      }

      if (cache.interaction?.editReply) {
        await cache.interaction.editReply({ embeds: [embed], files: [attachment] });
      } else {
        const channel = cache.msg?.channel;
        if (channel?.send) {
          await channel.send({ embeds: [embed], files: [attachment] });
        } else {
          console.error("❌ Nie znaleziono kanału do wysyłki wiadomości.");
        }
      }
    } catch (err) {
      console.error("❌ Błąd przy wysyłaniu wiadomości:", err);
    }

    this.callNextAction(cache);
  },

  mod() {},
};
