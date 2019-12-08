


const AlbumsSchema = {
  ownerName: {
    type: String,
    //unique: true,
    required: true,
  },
  title: {
    type: String,
    required: false
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  cost: {
    type: Number,
    required: false,
    //default: 0,
  },
  description: {
    type: String,
    required: false
  },
  htmlCode: {
    type: Boolean,
    default: false,
    required: false
  },
  javascriptCode: {
    type: Boolean,
    default: false,
    required: false
  },
  cssCode: {
    type: Boolean,
    default: false,
    required: false
  },
  keyword: {
    type: String,
    required: false
  }
};

//---------------------------------------------------
