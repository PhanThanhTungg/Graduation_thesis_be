import { BadRequestException, NotFoundException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { generateUniqueSlug } from 'src/common/utils/slug.util';
import { LoggingService } from 'src/shared/logging/logging.service';
import { successResponse } from 'src/common/interfaces/response.interface';
import { categoryFilter } from 'src/common/interfaces/objectFilter.interface';
import { CategoryService } from '../category.service';

@Injectable()
export class AdminCategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggingService,
    private readonly categoryService: CategoryService
  ) {}

  async getCategories(filter: categoryFilter) {
    const { keySearch, sortField = 'createdAt', sortOrder = 'asc' } = filter;
    const categories = await this.prisma.category.findMany({
      where: {
        ...(keySearch && { title: { contains: keySearch, mode: 'insensitive' } }),
        deletedAt: null
      },
      ...(sortField && sortOrder && { orderBy: { [sortField]: sortOrder } }),
    });

    const response: successResponse = {
      message: 'Get categories successfully',
      data: categories
    };
    return response;
  }

  async createCategory(createCategoryData: CreateCategoryDto) {
    const {parentId} = createCategoryData;
    const isExistedParentId = parentId ? await this.categoryService.checkExistedCategoryById(parentId) : true;
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
    const isExistedCategory = await this.categoryService.checkExistedCategoryById(id);
    if (!isExistedCategory) {
      throw new NotFoundException('Category is not existed');
    }

    const {parentId} = updateCategoryData;
    const isExistedParentId = parentId ? await this.categoryService.checkExistedCategoryById(parentId) : true;
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
    const isExistedCategory = await this.categoryService.checkExistedCategoryById(id);
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
}
