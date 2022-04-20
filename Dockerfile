FROM node:16 AS BUILD

WORKDIR /app

ADD . /app

# Add package file
COPY package.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source
COPY src ./src
COPY tsconfig.json ./tsconfig.json

# Build tsc
RUN yarn tsc-build
# RUN npm install typescript -g
# RUN tsc

# remove development dependencies
RUN npm prune --production

# Start production image build
FROM node:16-alpine

# copy from build image
COPY --from=BUILD /app/dist ./dist
COPY --from=BUILD /app/node_modules ./node_modules

# Add env
ENV NODE_ENV=production

CMD ["node", "dist/Main.js"]