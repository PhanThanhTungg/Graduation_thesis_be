import { NotFoundException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { categoryFilter, objectSearchFilter } from 'src/common/interfaces/objectFilter.interface';
import { LoggingService } from 'src/shared/logging/logging.service';
import { Category } from '@prisma/client';
import { successResponse } from 'src/common/interfaces/response.interface';
import { CategoryService } from '../category.service';

@Injectable()
export class ClientCategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggingService,
    private readonly categoryService: CategoryService
  ) {}

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        slug,
        deletedAt: null
      }
    });

    if(!category) throw new NotFoundException("Category is not existed");

    const response: successResponse = {
      message: 'Get category successfully',
      data: category
    };
    return response;
  }
  
  async getAllCategories(filter: objectSearchFilter) {
    const { keySearch } = filter;
    
    const categories = await this.prisma.category.findMany({
      where: {
        ...(keySearch && {
          title: { contains: keySearch, mode: 'insensitive' }
        }),
        deletedAt: null
      }
    });

    const response: successResponse = {
      message: 'Get all categories successfully',
      data: { categories: this.categoryService.getCategoryTree(categories) }
    };
    return response;
  }

  async getLeafCategories() {
    // Get all categories without children (leaf categories)
    const categories = await this.prisma.category.findMany({
      where: {
        deletedAt: null
      },
      include: {
        children: true
      }
    });

    // Filter only categories that have no children
    const leafCategories = categories.filter(category => category.children.length === 0);

    const response: successResponse = {
      message: 'Get leaf categories successfully',
      data: { 
        categories: leafCategories.map(({ children, ...category }) => category)
      }
    };
    return response;
  }


}
