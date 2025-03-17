import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { appConfig } from '../config';

@Injectable()
export class CatapushService {
  constructor(private readonly httpService: HttpService) {}

  async getAccessToken() {
    const config = appConfig();
    const response = await this.httpService.axiosRef.post(
      `1/auth/oauth?client_id=${config.catapush_client_id}&client_secret=${config.catapush_client_secret}&grant_type=client_credentials`,
    );
    return response.data.access_token;
  }

  async sendMessages(message: string, identifier: string, channel: string) {
    if (!message || !identifier) {
      throw new Error('Message and identifier is required');
    }

    const token = await this.getAccessToken();
    const config = appConfig();

    const data = {
      mobileAppId: config.catapush_messenger_id,
      text: message,
      recipients: [
        {
          identifier: identifier,
        },
      ],
      notificationText: message,
      channel,
    };
    const response = await this.httpService.axiosRef.post(`1/messages`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  async getUsers() {
    const token = await this.getAccessToken();
    const config = appConfig();
    const response = await this.httpService.axiosRef.get(`/1/apps/${config.catapush_app_id}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  async getUsersById(id: string) {
    const token = await this.getAccessToken();
    const config = appConfig();

    const response = await this.httpService.axiosRef.get(`/1/apps/${config.catapush_app_id}/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
  async createUser(userData: any) {
    const config = appConfig();

    const token = await this.getAccessToken();
    const response = await this.httpService.axiosRef.post(`/1/apps/${config.catapush_app_id}/users`, userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  async deleteUser(id: string) {
    const token = await this.getAccessToken();
    const config = appConfig();

    const response = await this.httpService.axiosRef.delete(`/1/apps/${config.catapush_app_id}/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
}
