import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api.models';
import {
  ConversationResponse, MessageResponse,
  StartConversationRequest, SendMessageRequest,
} from '../../shared/models/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  listConversations(): Observable<ApiResponse<ConversationResponse[]>> {
    return this.http.get<ApiResponse<ConversationResponse[]>>(`${this.base}/conversations`);
  }

  startConversation(req: StartConversationRequest): Observable<ApiResponse<ConversationResponse>> {
    return this.http.post<ApiResponse<ConversationResponse>>(`${this.base}/conversations`, req);
  }

  getConversation(convId: string): Observable<ApiResponse<ConversationResponse>> {
    return this.http.get<ApiResponse<ConversationResponse>>(`${this.base}/conversations/${convId}`);
  }

  getMessages(convId: string): Observable<ApiResponse<MessageResponse[]>> {
    return this.http.get<ApiResponse<MessageResponse[]>>(`${this.base}/conversations/${convId}/messages`);
  }

  sendMessage(convId: string, req: SendMessageRequest): Observable<ApiResponse<MessageResponse>> {
    return this.http.post<ApiResponse<MessageResponse>>(`${this.base}/conversations/${convId}/messages`, req);
  }

  markRead(convId: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/conversations/${convId}/read`, {});
  }

  deleteConversation(convId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/conversations/${convId}`);
  }
}
