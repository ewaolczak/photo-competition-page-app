const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if (title && author && email && file) {
      // if fields are not empty...

      const titlePattern = new RegExp(/^[\p{L}'][ \p{L}'-]*[\p{L}]/gmu);
      const authorPattern = new RegExp(/^[\p{L}'][ \p{L}'-]*[\p{L}]/gmu);
      const emailPattern = new RegExp(/[A-Z0-9._%+-]+@[A-Z0-9-]+.+.[A-Z]{2,4}/gim);

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];

      if (!titlePattern.test(title)) {
        throw new Error('Invalid title');
      }

      if (!authorPattern.test(title)) {
        throw new Error('Invalid author');
      }

      if (!emailPattern.test(email)) {
        throw new Error('Invalid email');
      }

      if ((fileExt === 'jpg' || fileExt === 'png' || fileExt === 'gif') && title.length <= 25 && author.length <= 50) {
        const newPhoto = new Photo({
          title,
          author,
          email,
          src: fileName,
          votes: 0
        });
        await newPhoto.save(); // ...save new photo in DB
        return res.json(newPhoto);
      } else {
        throw new Error('Wrong file type!');
      }
    } else {
      throw new Error('Wrong input!');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const userIP = requestIp.getClientIp(req);
    const findUser = await Voter.findOne({ user: userIP });
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });

    if (findUser) {
      // if user already voted...
      if (findUser.votes.includes(photoToUpdate._id)) {
        res.status(500).json(err);
      } else {
        // if user has not voted yet...
        photoToUpdate.votes += 1;
        await photoToUpdate.save();
        findUser.votes.push(photoToUpdate._id);
        await findUser.save();
        res.json(photoToUpdate);
      }
    } else {
      // if user has not voted yet...
      const newVoter = new Voter({ user: userIP, votes: [photoToUpdate._id] });
      await newVoter.save();
      photoToUpdate.votes += 1;
      await photoToUpdate.save();
      res.json(photoToUpdate);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};