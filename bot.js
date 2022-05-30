const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const request = require("request");
require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

mongoose.connect("mongodb://localhost:27017/rjdownloader", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Schema = mongoose.Schema;

const requestSchema = new Schema({
  _id: Schema.Types.ObjectId,
  sent_link: String,
  sent_date: Date,
  sender: { type: Schema.Types.ObjectId, ref: "User" },
});

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  telegram_id: String,
  telegram_first_name: String,
  telegram_last_name: String,
  telegram_username: String,
  start_date: Date,
  send_promo: Boolean,
  sent_requests: [{ type: Schema.Types.ObjectId, ref: "Request" }],
});

const Request = mongoose.model("Request", requestSchema);
const User = mongoose.model("User", userSchema);

var chatId = "";
var sentMessage = "";

// Promotion Message
const promo =
  " اگه از این ربات خوشت اومد لطفاً ‌اون رو برای دوستات هم بفرست 🙏🏻 \n راستی می‌تونی برای با خبر شدن از اطلاعیه‌ها و قابلیت‌های جدید کانال ربات رو دنبال کنی 👇🏻 \n 🔗 https://t.me/rjdownloader ";

// Processing Request Message
const processingMessages = [
  "⏳ لطفاً کمی صبر کنید",
  "🖨 در حال پردازش",
  "🎩 اجی مجی لا ترجی",
  "🧧 در حال مذاکره با رادیوجوان",
  "🌝 اندکی صبر سحر نزدیک است...",
  "📥 در حال دریافت آهنگ و ارسال آن برای شما 📤",
  "👀 در حال بررسی",
];

const mainMenu = [[{ text: "📕 راهنما" }, { text: "📲 دانلود" }]];

var messageStrings = "";
var isLink = false;

function sendProcessingMessage(msg) {
  const processingMessages = [
    "⏳ لطفاً کمی صبر کنید",
    "🖨 در حال پردازش",
    "🎩 اجی مجی لا ترجی",
    "🧧 در حال مذاکره با رادیوجوان",
    "🌝 اندکی صبر سحر نزدیک است...",
    "📥 در حال دریافت آهنگ و ارسال آن برای شما 📤",
    "👀 در حال بررسی",
  ];
  bot
    .sendMessage(
      msg.chat.id,
      processingMessages[Math.floor(Math.random() * processingMessages.length)],
      {
        reply_to_message_id: msg.message_id,
      }
    )
    .then((processingMessage) => {
      return processingMessage.message_id;
    }).catch(err => {
      console.log(err);
      sendErrorMessage(msg)
    });
}

function sendErrorMessage(msg) {
  const errorMessage = `مشکلی پیش آمد 😢
  لطفاً دوباره تلاش کنید 🙏`;
  bot.sendMessage(msg.cha.id, errorMessage, {
    reply_to_message_id: msg.message_id,
  });
}

function parseUrl(url) {
  request({ uri: url, followRedirect: false }, (err, httpResponse) => {
    if (err) {
      console.log(err);
      sendErrorMessage(msg.chat.id);
    } else {
      url = httpResponse.headers.location || url;
      url = sentUrl.split("#")[0];
      url = sentUrl.split("?")[0];
      const splitedUrl = sentUrl.split("/");
      const parseResult = {
        trackType: splitedUrl[4],
        track: splitedUrl[5],
      };
      return parseResult;
    }
  });
}

function checkTrackType(parseResult) {
  const trackType = parseResult.trackType;
  const track = parseResult.track;

  switch (trackType) {
    case "mp3":
      console.log("mp3");
      break;
    case "playlist":
      console.log("playlist");
      break;
    case "album":
      console.log("album");
      break;
    case "podcast":
      console.log("podcast");
      break;
    case "video":
      console.log("video");
      break;
    default:
      console.log("Track Type Error");
      sendErrorMessage(msg.chat.id);
  }
}

function processMusic(msg, music, processingMessageId) {
  const musicSentMessage = "آهنگت آماده دانلوده 👇🏻😎";
  const musicNotFoundmessage = " متآسفانه در حال حاضر این آهنگ قابل دریافت نیست 😅 \n لطفاً ‌آهنگ دیگری را امتحان کنید 🙏🏻";
  const mp3Endpoint = "https://host2.rj-mw1.com/media/mp3/mp3-320/";
  const podcastEndpoint = "https://host2.rj-mw1.com/media/podcast/mp3-320/";
  const videoEndpoint = "https://host2.rj-mw1.com/media/music_video/hd/";

  setTimeout(() => {
    bot
      .sendAudio(msg.chat.id, music, {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: mainMenu,
          resize_keyboard: true,
          one_time_keyboard: true,
        }),
      })
      .then(() => {
        bot
          .editMessageText(musicSentMessage, {
            chat_id: msg.chat.id,
            message_id: processingMessageId,
          })
          .then(() => {
            console.log("WRITE THE REQUEST");
          });
      })
      .catch((err) => {
        console.log(err);
        mp3Endpoint = "https://host1.rj-mw1.com/media/mp3/mp3-320/";
        trackUrl = mp3Endpoint + track + ".mp3";
        bot.sendAudio(msg.chat.id, trackUrl, {
          reply_markup: JSON.stringify({
            keyboard: mainMenu,
            resize_keyboard: true,
            one_time_keyboard: true,
          }),
          reply_to_message_id: msg.message_id,
        }).then(() => {
          bot
          .editMessageText(musicSentMessage, {
            chat_id: msg.chat.id,
            message_id: processingMessageId,
          })
          .then(() => {
            console.log("WRITE THE REQUEST");
          }).catch(err => {
            bot.editMessageText(
              " متآسفانه در حال حاضر این آهنگ قابل دریافت نیست 😅 \n لطفاً ‌آهنگ دیگری را امتحان کنید 🙏🏻",
              {
                chat_id: msg.chat.id,
                message_id: processingMessageId,
              }
            );
          })
        })
      });
  }, 700);
}

function sendMusic(msg, music) {
  bot.sendAudio(msg.chat.id, music, {
    reply_markup: JSON.stringify({
      keyboard: mainMenu,
      resize_keyboard: true,
      one_time_keyboard: true,
    }),
    reply_to_message_id: msg.message_id,
  });
}

function registerUser(msg) {
  const newUser = new User({
    _id: new mongoose.Types.ObjectId(),
    telegram_id: msg.from.id,
    telegram_first_name: msg.from.first_name,
    telegram_last_name: msg.from.last_name,
    telegram_username: msg.from.username,
    start_date: new Date(),
    send_promo: true,
  });
  const userRequest = new Request({
    _id: new mongoose.Types.ObjectId(),
    sent_link: msg.text,
    sent_date: new Date(),
    sender: newUser._id,
  });
  userRequest.save().then(() => {
    newUser.sent_requests.push(userRequest._id);
    newUser.save();
  });
}

function newRequest(msg) {
  const userRequest = new Request({
    _id: new mongoose.Types.ObjectId(),
    sent_link: msg.text,
    sent_date: new Date(),
    sender: newUser._id,
  });
  userRequest.save().then(() => {
    return userRequest._id
  })
}

bot.on("message", (msg) => {
  chatId = msg.chat.id;
  if (msg.caption) {
    messageStrings = msg.caption.split("\n");
  } else {
    messageStrings = msg.text.split("\n");
    if (messageStrings.length === 1) {
      isLink = true;
    }
  }

  if (isLink) {
    sentMessage = msg.text;
  }

  for (let i = 0; i < messageStrings.length; i++) {
    if (messageStrings[i].startsWith("https")) {
      sentMessage = messageStrings[i];
    }
  }

  if (sentMessage.startsWith("http") || sentMessage.startsWith("https")) {
    var sentUrl = sentMessage;

    User.findOne({ telegram_id: msg.from.id }, (err, foundUser) => {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          const userRequest = new Request({
            _id: new mongoose.Types.ObjectId(),
            sent_link: msg.text,
            sent_date: new Date(),
            sender: foundUser._id,
          });
          userRequest.save().then(() => {
            foundUser.sent_requests.push(userRequest._id);
            if (foundUser.send_promo === undefined) {
              foundUser.send_promo = true;
            }
            foundUser.save();
          });
        } else {
          const newUser = new User({
            _id: new mongoose.Types.ObjectId(),
            telegram_id: msg.from.id,
            telegram_first_name: msg.from.first_name,
            telegram_last_name: msg.from.last_name,
            telegram_username: msg.from.username,
            start_date: new Date(),
            send_promo: true,
          });
          const userRequest = new Request({
            _id: new mongoose.Types.ObjectId(),
            sent_link: msg.text,
            sent_date: new Date(),
            sender: newUser._id,
          });
          userRequest.save().then(() => {
            newUser.sent_requests.push(userRequest._id);
            newUser.save();
          });
        }
      }
    });

    request({ uri: sentUrl, followRedirect: false }, (err, httpResponse) => {
      if (err) {
        console.log(err);
        bot.sendMessage(
          chatId,
          "😣 متأسفانه لینک قابل بررسی نیست \n 🙏🏻 لطفاً‌ دوباره امتحان کنید"
        );
      } else {
        sentUrl = httpResponse.headers.location || sentUrl;
        sentUrl = sentUrl.split("#")[0];
        sentUrl = sentUrl.split("?")[0];
        const splitUrl = sentUrl.split("/");
        const track = splitUrl[5];
        var mp3Endpoint = "https://host2.rj-mw1.com/media/mp3/mp3-320/";
        const podcastEndpoint =
          "https://host2.rj-mw1.com/media/podcast/mp3-320/";
        const videoEndpoint = "https://host2.rj-mw1.com/media/music_video/hd/";
        var trackUrl = "";

        if (splitUrl[4] === "mp3") {
          trackUrl = mp3Endpoint + track + ".mp3";
          bot
            .sendMessage(
              chatId,
              processingMessages[
                Math.floor(Math.random() * processingMessages.length)
              ],
              {
                reply_to_message_id: msg.message_id,
              }
            )
            .then((processingMessage) => {
              const processingMessageId = processingMessage.message_id;
              setTimeout(() => {
                bot
                  .sendAudio(chatId, trackUrl, {
                    reply_markup: JSON.stringify({
                      keyboard: mainMenu,
                      resize_keyboard: true,
                      one_time_keyboard: true,
                    }),
                  })
                  .then(() => {
                    bot
                      .editMessageText("آهنگت آماده دانلوده 👇🏻😎", {
                        chat_id: msg.chat.id,
                        message_id: processingMessageId,
                      })
                      .then(() => {
                        User.findOne(
                          { telegram_id: msg.from.id },
                          (err, foundUser) => {
                            if (err) {
                              console.log(err);
                            } else {
                              if (foundUser) {
                                if (foundUser.send_promo === true) {
                                  bot.sendMessage(chatId, promo);
                                  foundUser.send_promo = false;
                                  foundUser.save();
                                }
                              }
                            }
                          }
                        );
                      });
                  })
                  .catch((err) => {
                    mp3Endpoint = "https://host1.rj-mw1.com/media/mp3/mp3-320/";
                    trackUrl = mp3Endpoint + track + ".mp3";
                    bot
                      .sendAudio(chatId, trackUrl, {
                        reply_markup: JSON.stringify({
                          keyboard: mainMenu,
                          resize_keyboard: true,
                          one_time_keyboard: true,
                        }),
                      })
                      .then(() => {
                        bot
                          .editMessageText("آهنگت آماده دانلوده 👇🏻😎", {
                            chat_id: msg.chat.id,
                            message_id: processingMessageId,
                          })
                          .then(() => {
                            User.findOne(
                              { telegram_id: msg.from.id },
                              (err, foundUser) => {
                                if (err) {
                                  console.log(err);
                                } else {
                                  if (foundUser) {
                                    if (foundUser.send_promo === true) {
                                      bot.sendMessage(chatId, promo);
                                      foundUser.send_promo = false;
                                      foundUser.save();
                                    }
                                  }
                                }
                              }
                            );
                          });
                      })
                      .catch((err) => {
                        bot.editMessageText(
                          " متآسفانه در حال حاضر این آهنگ قابل دریافت نیست 😅 \n لطفاً ‌آهنگ دیگری را امتحان کنید 🙏🏻",
                          {
                            chat_id: msg.chat.id,
                            message_id: processingMessageId,
                          }
                        );
                      });
                  });
              }, 700);
            });
        } else if (splitUrl[3] === "playlists") {
          User.findOne({ telegram_id: msg.from.id }, (err, foundUser) => {
            if (err) {
              console.log(err);
            } else {
              if (foundUser) {
                if (foundUser.send_promo) {
                  bot.sendMessage(chatId, promo);
                  foundUser.send_promo = false;
                  foundUser.save();
                }
              }
            }
          });
          axios.get(sentUrl).then((response) => {
            const page = response.data;
            const $ = cheerio.load(page);
            bot
              .sendMessage(chatId, "این هم آهنگ‌های پلی‌لیست 👇🏻😎", {
                reply_markup: JSON.stringify({
                  keyboard: mainMenu,
                  resize_keyboard: true,
                  one_time_keyboard: true,
                }),
              })
              .then(() => {
                for (let i = 0; i < $(".songInfo").length; i++) {
                  let trackUrl = "";
                  if ($("span.artist")[i] === undefined) {
                    break;
                  }
                  trackUrl =
                    mp3Endpoint +
                    $("span.artist")[i].attribs.title.replaceAll(" ", "-") +
                    "-" +
                    $("span.song")[i].attribs.title.replaceAll(" ", "-") +
                    ".mp3";

                  bot.sendAudio(chatId, trackUrl).catch((err) => {
                    mp3Endpoint = "https://host1.rj-mw1.com/media/mp3/mp3-320/";
                    trackUrl =
                      mp3Endpoint +
                      $("span.artist")[i].attribs.title.replaceAll(" ", "-") +
                      "-" +
                      $("span.song")[i].attribs.title.replaceAll(" ", "-") +
                      ".mp3";
                    bot.sendAudio(chatId, trackUrl);
                  });
                }
              });
          });
        } else if (splitUrl[4] === "album") {
          User.findOne({ telegram_id: msg.from.id }, (err, foundUser) => {
            if (err) {
              console.log(err);
            } else {
              if (foundUser) {
                if (foundUser.send_promo) {
                  bot.sendMessage(chatId, promo);
                  foundUser.send_promo = false;
                  foundUser.save();
                }
              }
            }
          });
          axios.get(sentUrl).then((response) => {
            const page = response.data;
            const $ = cheerio.load(page);
            bot
              .sendMessage(chatId, "این هم آهنگ‌های آلبوم 👇🏻😎", {
                reply_markup: JSON.stringify({
                  keyboard: mainMenu,
                  resize_keyboard: true,
                  one_time_keyboard: true,
                }),
              })
              .then(() => {
                for (let i = 0; i < $(".songInfo").length; i++) {
                  let trackUrl = "";
                  if ($("span.artist")[i] === undefined) {
                    break;
                  }
                  trackUrl =
                    mp3Endpoint +
                    $("span.artist")[i].children[0].data.replaceAll(" ", "-") +
                    "-" +
                    $("span.song")[i].children[0].data.replaceAll(" ", "-") +
                    ".mp3";

                  bot.sendAudio(chatId, trackUrl).catch((err) => {
                    mp3Endpoint = "https://host1.rj-mw1.com/media/mp3/mp3-320/";
                    trackUrl =
                      mp3Endpoint +
                      $("span.artist")[i].attribs.title.replaceAll(" ", "-") +
                      "-" +
                      $("span.song")[i].attribs.title.replaceAll(" ", "-") +
                      ".mp3";
                    bot.sendAudio(chatId, trackUrl);
                  });
                }
              });
          });
        } else if (splitUrl[3] === "podcasts") {
          trackUrl = podcastEndpoint + track + ".mp3";
          bot
            .sendMessage(
              chatId,
              "متاسفانه در حال حاضر فایل‌های پادکست قابل اپلود نیستند 😅 \n از طریق لینک زیر می‌توانید آن را دانلود کنید 🙏🏻",
              { reply_to_message_id: msg.message_id }
            )
            .then(() => {
              bot.sendMessage(chatId, trackUrl);
            })
            .then(() => {
              User.findOne({ telegram_id: msg.from.id }, (err, foundUser) => {
                if (err) {
                  console.log(err);
                } else {
                  if (foundUser) {
                    if (foundUser.send_promo === true) {
                      bot.sendMessage(chatId, promo);
                      User.findOne(
                        { telegram_id: msg.from.id },
                        (err, foundUser) => {
                          if (err) {
                            console.log(err);
                          } else {
                            if (foundUser) {
                              if (foundUser.send_promo === true) {
                                bot.sendMessage(chatId, promo);
                                foundUser.send_promo = false;
                                foundUser.save();
                              }
                            }
                          }
                        }
                      );
                    }
                  }
                }
              });
            });
        } else if (splitUrl[3] === "videos") {
          trackUrl = videoEndpoint + track + ".mp4";
          bot
            .sendMessage(
              chatId,
              "متاسفانه در حال حاضر فایل‌های ویدیو قابل اپلود نیستند 😅 \n از طریق لینک زیر می‌توانید آن را دانلود کنید 🙏🏻",
              { reply_to_message_id: msg.message_id }
            )
            .then(() => {
              bot.sendMessage(chatId, trackUrl);
            })
            .then(() => {
              User.findOne({ telegram_id: msg.from.id }, (err, foundUser) => {
                if (err) {
                  console.log(err);
                } else {
                  if (foundUser) {
                    if (foundUser.send_promo === true) {
                      bot.sendMessage(chatId, promo).then(() => {
                        foundUser.send_promo = false;
                        foundUser.save();
                      });
                    }
                  }
                }
              });
            });
        } else {
          bot.sendMessage(
            chatId,
            "متأسفانه لینک قابل بررسی نیست 😣 \n دوباره یک لینک دیگر را امتحان کنید 🙏🏻"
          );
        }
      }
    });
  } else {
    switch (sentMessage) {
      case "/start":
        User.findOne({ telegram_id: msg.from.id }, (err, foundUser) => {
          if (err) {
            console.log(err);
          } else {
            if (!foundUser) {
              const newUser = new User({
                _id: new mongoose.Types.ObjectId(),
                telegram_id: msg.from.id,
                telegram_first_name: msg.from.first_name,
                telegram_last_name: msg.from.last_name,
                telegram_username: msg.from.username,
                start_date: new Date(),
                send_promo: true,
              });
              newUser.save().then(() => {
                bot.sendMessage(
                  chatId,
                  "سلام دوست عزیز، خوش اومدی 👋🏻 \n از منوی زیر می‌تونی دستورت رو برام بفرستی 👇🏻",
                  {
                    reply_markup: JSON.stringify({
                      keyboard: mainMenu,
                      resize_keyboard: true,
                      one_time_keyboard: true,
                    }),
                    reply_to_message_id: msg.message_id,
                  }
                );
              });
            } else {
              bot.sendMessage(
                chatId,
                "سلام دوست عزیز، خوش اومدی 👋🏻 \n از منوی زیر می‌تونی دستورت رو برام بفرستی 👇🏻",
                {
                  reply_markup: JSON.stringify({
                    keyboard: mainMenu,
                    resize_keyboard: true,
                    one_time_keyboard: true,
                  }),
                  reply_to_message_id: msg.message_id,
                }
              );
            }
          }
        });
        break;
      case "📕 راهنما":
        bot.sendVideo(
          chatId,
          "BAACAgQAAxkBAAIoHWEVXEB2eyvD5nHiVyc5sEZ9Y3xhAAI3CwACPFqwUJKB5YWAI7c6IAQ",
          {
            caption:
              "🔼 برای ارسال لینک آهنگ، پادکست یا ویدیو کافیه داخل اپ یا سایت رادیوجوان آهنگ رو Share کنید، تلگرام رو از لیست اپلیکیشن‌ها انتخاب کنید و اون رو برای ربات بفرستید",
            reply_markup: JSON.stringify({
              keyboard: mainMenu,
              resize_keyboard: true,
              one_time_keyboard: true,
            }),
            reply_to_message_id: msg.message_id,
          }
        );
        break;
      case "📲 دانلود":
        bot.sendMessage(
          msg.chat.id,
          "لطفاً آهنگ، پادکست یا ویدیو رو از اپ رادیو جوان برام share کن یا لینکش رو برام بفرست 🙏🏻",
          {
            reply_markup: JSON.stringify({
              remove_keyboard: true,
            }),
            reply_to_message_id: msg.message_id,
          }
        );
        break;
      default:
        bot.sendMessage(
          chatId,
          "متأسفانه پیام شما قابل پردازش نیست 😥 \n لطفاً لینک آهنگ، پادکست یا ویدیو مورد نظرتون رو ارسال کنید 🙏🏻",
          { reply_to_message_id: msg.message_id }
        );
    }
  }
});

bot.on("polling_error", (err) => {
  console.log(err);
});