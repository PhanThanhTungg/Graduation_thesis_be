import { BadRequestException, NotFoundException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { generateUniqueSlug } from 'src/common/utils/slug.util';
import { fullObjectFilter } from 'src/common/interfaces/objectFilter.interface';
import { LoggingService } from 'src/shared/logging/logging.service';
import { Category } from '@prisma/client';

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
    if (!category) {
      throw new NotFoundException('Category is not existed');
    }
    return category;
  }
  
  async getAllCategories(filter: fullObjectFilter) {
    const { keySearch, page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'asc' } = filter;
    
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
      skip: page && limit ? (page - 1) * +limit : 0,
      take: +limit,
    });
    
    if(categories.length === 0) throw new NotFoundException('No categories found');

    const totalCategories = await this.prisma.category.count({
      where: {
        ...(keySearch && {
          title: { contains: keySearch, mode: 'insensitive' }
        }),
        deletedAt: null
      }
    });

    const totalPages = Math.ceil(totalCategories / limit);
    return { categories: this.getCategoryTree(categories), totalPages };
    
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
    return category;
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
      where: { id },
      data: {
        ...updateCategoryData,
        ...(updateCategoryData.title && { slug: generateUniqueSlug(updateCategoryData.title) }),
      }
    });
    return category;
  }

  async deleteSoftById(id: string) {
    const isExistedCategory = await this.checkExistedCategoryById(id);
    if (!isExistedCategory) {
      throw new NotFoundException('Category is not existed');
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    return category;
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
