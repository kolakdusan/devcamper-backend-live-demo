const mongoose = require('mongoose')

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a course title'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  weeks: {
    type: String,
    required: [true, 'Please add number of weeks'],
  },
  tuition: {
    type: Number,
    required: [true, 'Please add a tuition cost'],
  },
  minimumSkill: {
    type: String,
    required: [true, 'Please add a minimum skll'],
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bootcamp',
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
})

CourseSchema.statics.getAverageCost = async function (bootcampId) {
  // console.log(`Calculating avg cost for ${bootcampId}...`.blue)
  const count = await this.find()
  // console.log(count.length)
  if (count.length !== 0) {
    const obj = await this.aggregate([
      {
        $match: { bootcamp: bootcampId },
      },
      {
        $group: {
          _id: '$bootcamp',
          averageCost: { $avg: '$tuition' },
        },
      },
    ])
    // console.log(obj)

    try {
      await mongoose.model('Bootcamp').findByIdAndUpdate(bootcampId, {
        averageCost: Math.ceil(obj[0].averageCost / 10) * 10,
      })
    } catch (err) {
      console.log(err)
    }
  } else {
    try {
      await mongoose.model('Bootcamp').findByIdAndUpdate(bootcampId, {
        averageCost: 0,
      })
      await mongoose
        .model('Bootcamp')
        .findByIdAndUpdate(bootcampId, { $unset: { averageCost: 1 } })
    } catch (err) {
      console.log(err)
    }
  }
}

CourseSchema.post('save', function () {
  this.constructor.getAverageCost(this.bootcamp)
})

CourseSchema.post(
  'deleteOne',
  { query: true, document: false },
  async function () {
    let id = this.getQuery()['bootcamp']
    mongoose.model('Course').getAverageCost(id)
  }

  // Call getAverageCost before remove
  // CourseSchema.pre('deleteOne', function () {
  //   this.constructor.getAverageCost(this.bootcamp)
  // })
)

module.exports = mongoose.model('Course', CourseSchema)
