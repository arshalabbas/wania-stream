const express = require("express");
const fs = require("fs");
const url = require("url");
const YouTube = require("youtube-sr").default;
const ytdl = require("ytdl-core");
const app = express();

function playError(res, { error }) {
  let file;

  if (error) {
    file = __dirname + "/error-sounds/" + error + ".mp3";
  }

  fs.exists(file, (exists) => {
    if (exists) {
      const rstream = fs.createReadStream(file);
      rstream.pipe(res);
    } else {
      res.send("Error - 404");
      res.end();
    }
  });
}

function playFromYoutube(res, url) {
  try {
    const mediaFile = ytdl(url, { filter: "audioonly" });
    mediaFile.pipe(res);
  } catch (error) {
    playError(res, { error: "went-wrong" });
    console.error(error);
  }
}

app.get("/", (req, res) => {
  res.send("service is online!");
});

app.get("/play", (req, res) => {
  const query = req.query;

  //if we didn't provide the parameters or provide wrong parameters
  if (!query.title && !query.url)
    return playError(res, { error: "params-error" });

  //if we provide both title and url
  if (query.title && query.url) return playError(res, { error: "anyone" });

  if (query.title) {
    YouTube.searchOne(query.title)
      .then((response) => {
        if (!response) return playError(res, { error: "no-result" });

        playFromYoutube(res, response.url);
      })
      .catch((error) => {
        playError(res, { error: "went-wrong" });
        console.error(error);
      });
  } else if (query.url) {
    const videoPattern =
      /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
    const urlValid = videoPattern.test(query.url);

    if (!urlValid) return playError(res, { error: "url-error" });

    playFromYoutube(res, query.url);
  }
});

app.listen(3000, () => {
  console.log("app is listening to port 3000");
});
