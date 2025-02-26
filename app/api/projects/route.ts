import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project, { IProject } from '@/src/models/Project';
import { Types } from 'mongoose';

interface DiscordSubtask {
  id: string;
  title: string;
  required: boolean;
}

interface DiscordTask {
  id: string;
  title: string;
  description: string;
  points: number;
  dueDate: string;
  subtasks?: DiscordSubtask[];
}

interface SocialTask {
  id: string;
  title: string;
  description: string;
  points: number;
  dueDate: string;
}

interface ProjectData {
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
    phases: Array<{
      name: string;
      duration: string;
      time: string;
    }>;
  };
  howToMint: {
    steps: string[];
  };
  importantLinks: Array<{
    title: string;
    url: string;
    icon: string;
  }>;
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
      tasks: DiscordTask[];
      progress: number;
    };
    social: {
      title: string;
      description: string;
      tasks: SocialTask[];
      progress: number;
    };
  };
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  // Log headers for debugging
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  // Check for authorization header
  const authHeader = request.headers.get('authorization');
  console.log('Auth Header:', authHeader);
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ 
      error: 'Authentication required',
      received_header: authHeader
    }, { status: 401 });
  }

  // Get email from Bearer token
  const userEmail = authHeader.split(' ')[1];
  if (!userEmail || !userEmail.includes('@')) {
    return NextResponse.json({ 
      error: 'Invalid authentication token',
      received_email: userEmail
    }, { status: 401 });
  }

  try {
    await dbConnect();
    const projects = await Project.find().sort({ createdAt: -1 });
    
    // Transform projects to match the new schema
    const transformedProjects = projects.map(project => {
      const plainProject = (project as IProject & { _id: Types.ObjectId }).toObject();
      return {
        id: plainProject._id.toString(),
        name: plainProject.name || plainProject.title || '',
        coverImage: plainProject.coverImage || plainProject.imageUrl || '',
        status: plainProject.status || 'COMING_SOON',
        overview: {
          description: plainProject.overview?.description || plainProject.description || ''
        },
        tags: plainProject.tags || [],
        createdAt: plainProject.createdAt,
        updatedAt: plainProject.updatedAt,
        // Include other fields that might be needed
        nftDetails: plainProject.nftDetails || {
          title: '',
          description: '',
          features: []
        },
        mintDetails: plainProject.mintDetails || {
          chain: '',
          supply: '',
          mintDate: '',
          phases: []
        },
        howToMint: plainProject.howToMint || {
          steps: []
        },
        importantLinks: plainProject.importantLinks || [],
        collaboration: plainProject.collaboration || {
          enabled: false,
          title: 'Want to collaborate?',
          description: 'Submit your application to become a partner',
          disabledMessage: 'You can\'t collaborate until project is live'
        }
      };
    });

    return NextResponse.json({ 
      success: true,
      data: transformedProjects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch projects' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting project creation...');

    // Check for admin access
    const adminAccess = request.cookies.get('adminAccess')?.value;
    console.log('Admin access:', adminAccess);
    
    if (!adminAccess || adminAccess !== 'true') {
      console.log('Admin access denied');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing or invalid auth header');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify admin email
    const adminEmail = authHeader.split(' ')[1];
    console.log('Admin email:', adminEmail);
    
    if (adminEmail !== 'admin@darknightlabs.com') {
      console.log('Invalid admin email');
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();
    console.log('Received data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    const requiredFields = [
      'name',
      'coverImage',
      'overview.description',
      'nftDetails.title',
      'nftDetails.description',
      'mintDetails.chain',
      'mintDetails.supply',
      'mintDetails.mintDate'
    ];

    for (const field of requiredFields) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], data);
      if (!value) {
        console.log(`Missing required field: ${field}`);
        return NextResponse.json({ 
          error: `${field} is required`,
          receivedData: data
        }, { status: 400 });
      }
    }

    // Create project with defaults for optional fields
    const projectData = {
      name: data.name,
      coverImage: data.coverImage,
      status: data.status || 'COMING_SOON',
      tags: data.tags || [],
      overview: {
        description: data.overview?.description || ''
      },
      nftDetails: {
        title: data.nftDetails?.title || '',
        description: data.nftDetails?.description || '',
        features: data.nftDetails?.features?.filter((f: string) => f.trim() !== '') || []
      },
      mintDetails: {
        chain: data.mintDetails?.chain || '',
        supply: data.mintDetails?.supply || '',
        mintDate: data.mintDetails?.mintDate || '',
        phases: data.mintDetails?.phases?.filter((p: { name: string; duration: string; time: string; }) => 
          p.name.trim() !== '' || p.duration.trim() !== '' || p.time.trim() !== ''
        ) || []
      },
      howToMint: {
        steps: data.howToMint?.steps?.filter((s: string) => s.trim() !== '') || []
      },
      importantLinks: data.importantLinks?.filter((l: { title: string; url: string; icon: string; }) => 
        l.title.trim() !== '' || l.url.trim() !== '' || l.icon.trim() !== ''
      ) || [],
      collaboration: {
        enabled: data.collaboration?.enabled || false,
        title: data.collaboration?.title || 'Want to collaborate?',
        description: data.collaboration?.description || 'Submit your application to become a partner',
        disabledMessage: data.collaboration?.disabledMessage || 'You can\'t collaborate until project is live'
      },
      tasks: {
        discord: {
          title: data.tasks?.discord?.title || 'Discord Tasks',
          description: data.tasks?.discord?.description || 'Complete Discord community tasks',
          tasks: data.tasks?.discord?.tasks?.map((task: DiscordTask) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            points: task.points,
            dueDate: task.dueDate,
            subtasks: task.subtasks?.map((subtask: DiscordSubtask) => ({
              id: subtask.id,
              title: subtask.title,
              required: subtask.required
            }))
          })) || [],
          progress: 0
        },
        social: {
          title: data.tasks?.social?.title || 'Social Media Tasks',
          description: data.tasks?.social?.description || 'Complete social media engagement tasks',
          tasks: data.tasks?.social?.tasks?.map((task: SocialTask) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            points: task.points,
            dueDate: task.dueDate
          })) || [],
          progress: 0
        }
      }
    };

    console.log('Processed project data:', JSON.stringify(projectData, null, 2));
    
    try {
      const project = await Project.create(projectData);
      console.log('Project created successfully:', project);
      
      return NextResponse.json({ 
        success: true,
        message: "Project created successfully",
        project: {
          id: project._id,
          ...project.toObject()
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      if (dbError instanceof Error) {
        console.error('Error details:', {
          message: dbError.message,
          stack: dbError.stack,
          name: dbError.name
        });
        if ('errors' in dbError) {
          console.error('Validation errors:', JSON.stringify(dbError.errors, null, 2));
          // Format validation errors for better readability
          const formattedErrors: Record<string, any> = {};
          Object.entries(dbError.errors || {}).forEach(([path, error]: [string, any]) => {
            // Get the nested path value
            const pathParts = path.split('.');
            let value: any = projectData as ProjectData;
            for (const part of pathParts) {
              value = value?.[part];
            }
            
            formattedErrors[path] = {
              message: error.message,
              value: value,
              kind: error.kind,
              path: path,
              data: projectData // Include full data for debugging
            };
          });

          console.log('Formatted errors:', JSON.stringify(formattedErrors, null, 2));
          console.log('Project data being validated:', JSON.stringify(projectData, null, 2));

          return NextResponse.json({ 
            error: 'Validation error',
            details: formattedErrors,
            receivedData: projectData
          }, { status: 400 });
        }
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Project creation error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 