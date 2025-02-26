import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  coverImage: string;
  status: string;
  tags: string[];
  overview: {
    description: string;
  };
  nftDetails: {
    title: string;
    description: string;
    features: string[];
  };
  mintDetails: {
    chain: string;
    supply: string;
    mintDate: string;
    phases: {
      name: string;
      duration: string;
      time: string;
    }[];
  };
  howToMint: {
    steps: string[];
  };
  importantLinks: {
    title: string;
    url: string;
    icon: string;
  }[];
  collaboration: {
    enabled: boolean;
    title: string;
    description: string;
    disabledMessage: string;
  };
  tasks: {
    discord: {
      title: string;
      description: string;
      tasks: {
        id: string;
        title: string;
        description: string;
        points: number;
        dueDate: string;
        subtasks?: {
          id: string;
          title: string;
          required: boolean;
        }[];
      }[];
      progress: number;
    };
    social: {
      title: string;
      description: string;
      tasks: {
        id: string;
        title: string;
        description: string;
        points: number;
        dueDate: string;
      }[];
      progress: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Delete the existing model if it exists
if (mongoose.models.Project) {
  delete mongoose.models.Project;
}

const ProjectSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  coverImage: {
    type: String,
    required: [true, 'Cover image URL is required']
  },
  status: {
    type: String,
    enum: ['COMING_SOON', 'LIVE', 'ENDED'],
    default: 'COMING_SOON'
  },
  tags: [{
    type: String,
    trim: true
  }],
  overview: {
    description: {
      type: String,
      required: [true, 'Overview description is required'],
      trim: true
    }
  },
  nftDetails: {
    title: {
      type: String,
      required: [true, 'NFT title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'NFT description is required'],
      trim: true
    },
    features: [{
      type: String,
      trim: true
    }]
  },
  mintDetails: {
    chain: {
      type: String,
      required: [true, 'Chain is required'],
      trim: true
    },
    supply: {
      type: String,
      required: [true, 'Supply is required'],
      trim: true
    },
    mintDate: {
      type: String,
      required: [true, 'Mint date is required']
    },
    phases: [{
      name: {
        type: String,
        trim: true
      },
      duration: {
        type: String,
        trim: true
      },
      time: {
        type: String,
        trim: true
      }
    }]
  },
  howToMint: {
    steps: [{
      type: String,
      trim: true
    }]
  },
  importantLinks: [{
    title: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    },
    icon: {
      type: String,
      trim: true
    }
  }],
  collaboration: {
    enabled: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Want to collaborate?'
    },
    description: {
      type: String,
      default: 'Submit your application to become a partner'
    },
    disabledMessage: {
      type: String,
      default: 'You can\'t collaborate until project is live'
    }
  },
  tasks: {
    discord: {
      title: {
        type: String,
        default: 'Discord Tasks'
      },
      description: {
        type: String,
        default: 'Complete Discord community tasks'
      },
      tasks: [{
        id: {
          type: String,
          required: true
        },
        title: {
          type: String,
          required: true
        },
        description: {
          type: String,
          required: true
        },
        points: {
          type: Number,
          required: true
        },
        dueDate: {
          type: String,
          required: true
        },
        subtasks: [{
          id: {
            type: String,
            required: true
          },
          title: {
            type: String,
            required: true
          },
          required: {
            type: Boolean,
            default: true
          }
        }]
      }],
      progress: {
        type: Number,
        default: 0
      }
    },
    social: {
      title: {
        type: String,
        default: 'Social Media Tasks'
      },
      description: {
        type: String,
        default: 'Complete social media engagement tasks'
      },
      tasks: [{
        id: {
          type: String,
          required: true
        },
        title: {
          type: String,
          required: true
        },
        description: {
          type: String,
          required: true
        },
        points: {
          type: Number,
          required: true
        },
        dueDate: {
          type: String,
          required: true
        }
      }],
      progress: {
        type: Number,
        default: 0
      }
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

export default mongoose.model<IProject>('Project', ProjectSchema); 