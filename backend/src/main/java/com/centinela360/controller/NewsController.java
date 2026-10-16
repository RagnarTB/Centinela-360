package com.centinela360.controller;

import com.centinela360.controller.dto.CreateNewsRequest;
import com.centinela360.controller.dto.NewsResponse;
import com.centinela360.service.NewsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/news")
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @GetMapping
    public Flux<NewsResponse> getAllNews() {
        return newsService.getAllNews();
    }

    @PostMapping
    public Mono<ResponseEntity<NewsResponse>> createNews(@Valid @RequestBody CreateNewsRequest request) {
        return newsService.createNews(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }
}
