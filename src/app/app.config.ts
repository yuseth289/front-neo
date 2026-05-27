import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { Store, provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideIcons } from '@ng-icons/core';
import { filter, firstValueFrom } from 'rxjs';
import {
  lucideShoppingCart, lucideLogIn, lucideUserPlus, lucideUser, lucideLogOut,
  lucideMapPin, lucideClipboardList, lucideFileText, lucideHeart, lucideStar,
  lucideLayoutDashboard, lucidePackage, lucideTrendingUp, lucideStore,
  lucideCreditCard, lucideHouse, lucideUsers, lucideTag, lucideSearch,
  lucideMenu, lucideX, lucideChevronRight, lucideChevronLeft, lucideShield,
  lucideTruck, lucideTriangleAlert, lucideCircleCheck, lucideRefreshCw,
  lucideSettings, lucidePlus, lucideTrash2, lucideCheck, lucideClipboardX,
  lucideHeartCrack, lucideImage, lucideReceipt, lucideShieldCheck,
  lucideUserCheck, lucideZap,
  lucideCircleUserRound, lucideLayoutGrid, lucideMail, lucideLock,
  lucideEye, lucideEyeOff, lucideArrowRight, lucideSparkles,
  lucideChevronDown, lucideChevronUp, lucideCircleAlert, lucidePhone, lucideHome,
  lucideArrowUpNarrowWide, lucideList, lucideInfo, lucideTrendingDown,
  lucideLink, lucideBadge, lucideDollarSign, lucideRocket, lucideGamepad2,
  lucideMouse, lucideKeyboard, lucideHeadphones, lucideMonitor, lucideJoystick,
  lucideLaptop, lucideBoxes, lucideGlobe, lucideUploadCloud,
  lucideBanknote, lucideExternalLink, lucideMinus,
  lucideBuilding2, lucideWallet,
  lucideLightbulb, lucidePencil, lucideImageUp, lucideListChecks,
  lucideSun, lucideMoon,
  lucideHeartOff, lucideBadgePercent,
  lucidePaperclip, lucideSmile, lucideMoreHorizontal,
  lucideMessageCircle, lucideSend,
  lucideBarChart2, lucideTrophy,
} from '@ng-icons/lucide';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { authReducer } from './core/auth/store/auth.reducer';
import { AuthEffects } from './core/auth/store/auth.effects';
import { authInterceptor } from './core/auth/auth.interceptor';
import { ssrApiUrlInterceptor } from './core/ssr-api-url.interceptor';
import * as AuthActions from './core/auth/store/auth.actions';
import { selectAuthInitialized } from './core/auth/store/auth.selectors';
import { cartReducer } from './core/cart/store/cart.reducer';
import { CartEffects } from './core/cart/store/cart.effects';
import { searchAiReducer } from './core/store/search-ai/search-ai.reducer';
import { SearchAiEffects } from './core/store/search-ai/search-ai.effects';
import { analyticsAiReducer } from './core/store/analytics-ai/analytics-ai.reducer';
import { AnalyticsAiEffects } from './core/store/analytics-ai/analytics-ai.effects';
import { sellerAiReducer } from './core/store/seller-ai/seller-ai.reducer';
import { SellerAiEffects } from './core/store/seller-ai/seller-ai.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([ssrApiUrlInterceptor, authInterceptor])),
    provideClientHydration(),
    provideStore({ auth: authReducer, cart: cartReducer, searchAi: searchAiReducer, analyticsAi: analyticsAiReducer, sellerAi: sellerAiReducer }),
    provideEffects([AuthEffects, CartEffects, SearchAiEffects, AnalyticsAiEffects, SellerAiEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: environment.production }),
    provideAppInitializer(() => {
      const store = inject(Store);
      store.dispatch(AuthActions.restoreSession());
      return firstValueFrom(
        store.select(selectAuthInitialized).pipe(filter((initialized) => initialized)),
      );
    }),
    provideIcons({
      lucideShoppingCart, lucideLogIn, lucideUserPlus, lucideUser, lucideLogOut,
      lucideMapPin, lucideClipboardList, lucideFileText, lucideHeart, lucideStar,
      lucideLayoutDashboard, lucidePackage, lucideTrendingUp, lucideStore,
      lucideCreditCard, lucideHouse, lucideUsers, lucideTag, lucideSearch,
      lucideMenu, lucideX, lucideChevronRight, lucideChevronLeft, lucideShield,
      lucideTruck, lucideTriangleAlert, lucideCircleCheck, lucideRefreshCw,
      lucideSettings, lucidePlus, lucideTrash2, lucideCheck, lucideClipboardX,
      lucideHeartCrack, lucideImage, lucideReceipt, lucideShieldCheck,
      lucideUserCheck, lucideZap,
      lucideCircleUserRound, lucideLayoutGrid, lucideMail, lucideLock,
      lucideEye, lucideEyeOff, lucideArrowRight, lucideSparkles,
      lucideChevronDown, lucideChevronUp, lucideCircleAlert, lucidePhone, lucideHome,
      lucideArrowUpNarrowWide, lucideList, lucideInfo, lucideTrendingDown,
      lucideLink, lucideBadge, lucideDollarSign, lucideRocket, lucideGamepad2,
      lucideMouse, lucideKeyboard, lucideHeadphones, lucideMonitor, lucideJoystick,
      lucideLaptop, lucideBoxes, lucideGlobe, lucideUploadCloud,
      lucideBanknote, lucideExternalLink, lucideMinus,
      lucideBuilding2, lucideWallet,
      lucideLightbulb, lucidePencil, lucideImageUp, lucideListChecks,
      lucideSun, lucideMoon,
      lucideHeartOff, lucideBadgePercent,
      lucidePaperclip, lucideSmile, lucideMoreHorizontal,
      lucideMessageCircle, lucideSend,
      lucideBarChart2, lucideTrophy,
    }),
  ],
};
