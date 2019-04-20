import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Server, ServerIcon, PinConfig } from '../server';
import { ServersService } from '../servers.service';
import { ServerFilters, ServerFilterContainer, ServerTags } from './server-filter.component';

import { GameService } from '../../game.service';

import { isPlatformBrowser } from '@angular/common';

import { Observable } from 'rxjs/observable';

import 'rxjs/add/operator/bufferTime';

@Component({
    moduleId: module.id,
    selector: 'servers-container',
    templateUrl: 'servers-container.component.html',
    styleUrls: ['servers-container.component.scss']
})
export class ServersContainerComponent implements OnInit {
    servers: { [addr: string]: Server } = {};
    
    localServers: Server[]; // temp value
    icons: ServerIcon[];

    pinConfig: PinConfig;

    filters: ServerFilterContainer;

    type: string;

    constructor(private serverService: ServersService, private gameService: GameService, private route: ActivatedRoute,
        @Inject(PLATFORM_ID) private platformId: any) {
        this.filters = new ServerFilterContainer();
        this.pinConfig = new PinConfig();
    }

    serversArray: Server[] = [];

    ngOnInit() {
        this.type = this.route.snapshot.data.type;

        if (isPlatformBrowser(this.platformId)) {
            this.loadServers();
        }
    }

    setFilters(filters: ServerFilters) {
        this.filters = {...this.filters, filters};
    }

    setTags(tags: ServerTags) {
        this.filters = {...this.filters, tags: { tagList: { ...tags.tagList } }};
    }

    isBrowser() {
        return isPlatformBrowser(this.platformId);
    }

    loadServers() {
        this.serverService.loadPinConfig()
            .then(pinConfig => this.pinConfig = pinConfig);


        const typedServers = this.serverService
            .getReplayedServers()
            .filter(a => a && this.gameService.isMatchingServer(this.type, a));

        // add each new server to our server list
        typedServers.subscribe(server => {
            if (!this.servers[server.address]) {
                this.serversArray.push(server);
            } else {
                this.serversArray.splice(
                    this.serversArray.findIndex(a => a.address === server.address),
                    1,
                    server);
            }

            this.serversArray = this.serversArray.slice();

            this.servers[server.address] = server;
        });

        // ping new servers after a while
        typedServers
            .bufferTime(100, null, 250)
            .subscribe(servers => (servers.length > 0) ? this.gameService.pingServers(servers) : null);
    }
}