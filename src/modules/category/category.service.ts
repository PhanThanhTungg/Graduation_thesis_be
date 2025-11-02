import { BadRequestException, NotFoundException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { generateUniqueSlug } from 'src/common/utils/slug.util';
import { categoryFilter } from 'src/common/interfaces/objectFilter.interface';
import { LoggingService } from 'src/shared/logging/logging.service';
import { Category } from '@prisma/client';
import { successResponse } from 'src/common/interfaces/response.interface';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggingService
  ) {}

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        slug,
        deletedAt: null
      }
    });

    const response: successResponse = {
      message: 'Get category successfully',
      data: category
    };
    return response;
  }
  
  async getAllCategories(filter: categoryFilter) {
    const { keySearch, sortField = 'createdAt', sortOrder = 'asc' } = filter;
    
    const categories = await this.prisma.category.findMany({
      where: {
        ...(keySearch && {
          title: { contains: keySearch, mode: 'insensitive' }
        }),
        deletedAt: null
      },
      ...((sortField && sortOrder) && {
        orderBy: {
          [sortField]: sortOrder
        }
      }),
    });

    const response: successResponse = {
      message: 'Get all categories successfully',
      data: { categories: this.getCategoryTree(categories) }
    };
    return response;
  }

  async createCategory(createCategoryData: CreateCategoryDto) {
    const isExistedParentId = await this.checkExistedCategoryById(createCategoryData.parentId);
    if (!isExistedParentId) {
      throw new BadRequestException('Parent category is not existed');
    }

    const category = await this.prisma.category.create({
      data: {
        ...createCategoryData,
        slug: generateUniqueSlug(createCategoryData.title),
      }
    });

    const response: successResponse = {
      message: 'Create category successfully',
      data: category
    };
    return response;
  }

  async updateCategory(id: string, updateCategoryData: UpdateCategoryDto) {
    const isExistedCategory = await this.checkExistedCategoryById(id);
    if (!isExistedCategory) {
      throw new NotFoundException('Category is not existed');
    }

    const isExistedParentId = await this.checkExistedCategoryById(updateCategoryData.parentId);
    if (!isExistedParentId) {
      throw new BadRequestException('Parent category is not existed');
    }

    const category = await this.prisma.category.update({
      where: { id , deletedAt: null },
      data: {
        ...updateCategoryData,
        ...(updateCategoryData.title && { slug: generateUniqueSlug(updateCategoryData.title) }),
      }
    });

    const response: successResponse = {
      message: 'Update category successfully',
      data: category
    };
    return response;
  }

  async deleteSoftById(id: string) {
    const isExistedCategory = await this.checkExistedCategoryById(id);
    if (!isExistedCategory) {
      throw new NotFoundException('Category is not existed');
    }

    const childCategories = await this.getAllChildCategoryIds(id);
    const allCategoryIds = [id, ...childCategories];

    await this.prisma.category.updateMany({
      where: { 
        id: { 
          in: allCategoryIds 
        } 
      },
      data: { deletedAt: new Date() }
    });

    const response: successResponse = {
      message: 'Delete category successfully'
    };
    return response;
  }

  private async getAllChildCategoryIds(parentId: string): Promise<string[]> {
    const children = await this.prisma.category.findMany({
      where: { parentId },
      select: { id: true }
    });

    if (children.length === 0) {
      return [];
    }

    const childIds = children.map(child => child.id);
    const grandChildIds = await Promise.all(
      childIds.map(id => this.getAllChildCategoryIds(id))
    );

    return [...childIds, ...grandChildIds.flat()];
  }

  private async checkExistedCategoryById(id?: string) {
    if (!id) return true;
    const category = await this.prisma.category.findUnique({
      where: {
        id
      }
    });
    return !!category;
  }

  private getCategoryTree(categories: Category[]) {
    const categoryMap: { [key: string]: any } = {};
    const tree: Category[] = [];
    
    categories.forEach((item: any) => {
      categoryMap[item.id] = { ...item, children: [] };
    });
    
    categories.forEach((item: any) => {
      const category = categoryMap[item.id];
      
      if (item.parentId === null || item.parentId === undefined) {
        tree.push(category);
      } else if (categoryMap[item.parentId]) {
        categoryMap[item.parentId].children.push(category);
      } else {
        tree.push(category);
      }
    });
    
    return tree;
  }

}
