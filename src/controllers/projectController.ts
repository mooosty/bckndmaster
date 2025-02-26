import { NextRequest, NextResponse } from 'next/server';
import { apiResponse } from '../utils/apiResponse';
import Project, { IProject } from '../models/Project';
import dbConnect from '@/lib/db';

class ProjectController {
  // Update project status
  async updateStatus(id: string, req: NextRequest) {
    try {
      await dbConnect();
      const data = await req.json();
      
      if (!data.status) {
        return apiResponse.error('Status is required', 400);
      }

      // Validate status
      const validStatuses = ['COMING_SOON', 'LIVE', 'ENDED'];
      if (!validStatuses.includes(data.status)) {
        return apiResponse.error('Invalid status. Must be one of: ' + validStatuses.join(', '), 400);
      }

      const project = await Project.findById(id);
      if (!project) {
        return apiResponse.error('Project not found', 404);
      }

      project.status = data.status;
      await project.save();

      return apiResponse.success(project, 'Project status updated successfully');
    } catch (error) {
      return apiResponse.serverError(error);
    }
  }

  // Create a new project
  async create(req: NextRequest) {
    try {
      await dbConnect();
      const data = await req.json();

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
          return apiResponse.error(`${field} is required`, 400);
        }
      }

      const project = await Project.create({
        ...data,
        status: data.status || 'COMING_SOON'
      });
      
      return apiResponse.success(project, 'Project created successfully');
    } catch (error) {
      return apiResponse.serverError(error);
    }
  }

  // Get all projects
  async getAll() {
    try {
      await dbConnect();
      const projects = await Project.find({}).sort({ createdAt: -1 });
      return apiResponse.success(projects);
    } catch (error) {
      return apiResponse.serverError(error);
    }
  }

  // Get a single project by ID
  async getById(id: string) {
    try {
      await dbConnect();
      const project = await Project.findById(id);
      if (!project) {
        return apiResponse.error('Project not found', 404);
      }
      return apiResponse.success(project);
    } catch (error) {
      return apiResponse.serverError(error);
    }
  }

  // Update a project
  async update(id: string, req: NextRequest) {
    try {
      await dbConnect();
      const data = await req.json();
      
      const project = await Project.findById(id);
      if (!project) {
        return apiResponse.error('Project not found', 404);
      }

      // Update only the fields that are provided
      const updateData = {
        ...data,
        nftDetails: data.nftDetails ? {
          ...project.nftDetails,
          ...data.nftDetails
        } : project.nftDetails,
        mintDetails: data.mintDetails ? {
          ...project.mintDetails,
          ...data.mintDetails
        } : project.mintDetails,
        howToMint: data.howToMint ? {
          ...project.howToMint,
          ...data.howToMint
        } : project.howToMint,
        collaboration: data.collaboration ? {
          ...project.collaboration,
          ...data.collaboration
        } : project.collaboration
      };

      const updatedProject = await Project.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      return apiResponse.success(updatedProject, 'Project updated successfully');
    } catch (error) {
      return apiResponse.serverError(error);
    }
  }

  // Delete a project
  async delete(id: string) {
    try {
      await dbConnect();
      const project = await Project.findByIdAndDelete(id);
      if (!project) {
        return apiResponse.error('Project not found', 404);
      }
      return apiResponse.success(null, 'Project deleted successfully');
    } catch (error) {
      return apiResponse.serverError(error);
    }
  }
}

export default new ProjectController(); 